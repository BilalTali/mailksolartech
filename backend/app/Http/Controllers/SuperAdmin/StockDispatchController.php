<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminInventory;
use App\Models\AdminStockDispatch;
use App\Models\AdminStockDispatchItem;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockDispatchController extends Controller
{
    /**
     * GET /super-admin/stock-dispatches
     * List all dispatches sent by this Super Admin, newest first.
     */
    public function index(Request $request)
    {
        $dispatches = AdminStockDispatch::with(['admin:id,name,mobile', 'items.inventoryItem'])
            ->where('super_admin_id', $request->user()->id)
            ->latest('dispatched_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json(['success' => true, 'data' => $dispatches]);
    }

    /**
     * GET /super-admin/stock-dispatches/form-data
     * Returns list of admin users and available inventory items for the dispatch form.
     */
    public function formData(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'admins'    => User::where('role', 'admin')
                    ->where('status', 'active')
                    ->select('id', 'name', 'mobile')
                    ->orderBy('name')
                    ->get(),
                'inventory' => InventoryItem::where('is_active', true)
                    ->where('current_stock', '>', 0)
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get(['id', 'name', 'make', 'sku', 'category', 'unit', 'current_stock']),
            ],
        ]);
    }

    /**
     * POST /super-admin/stock-dispatches
     * Validate → Atomically decrement global stock → Create dispatch + item records.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'admin_id'                      => 'required|exists:users,id',
            'driver_name'                   => 'required|string|max:150',
            'driver_phone'                  => 'required|string|max:20',
            'vehicle_number'                => 'required|string|max:50',
            'expected_delivery_date'        => 'nullable|date|after_or_equal:today',
            'notes'                         => 'nullable|string|max:1000',
            'items'                         => 'required|array|min:1',
            'items.*.inventory_item_id'     => 'required|exists:inventory_items,id',
            'items.*.quantity'              => 'required|integer|min:1',
            'items.*.serial_numbers'        => 'nullable|array',
        ]);

        // Verify recipient is an active admin (not another super admin)
        $recipient = User::findOrFail($validated['admin_id']);
        if ($recipient->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Recipient must be an Admin user, not ' . $recipient->role,
            ], 422);
        }

        DB::transaction(function () use ($validated, $request) {
            // ── Step 1: Validate & decrement global warehouse stock ──────────
            foreach ($validated['items'] as $item) {
                // Row lock prevents race conditions from concurrent dispatches
                $inv = InventoryItem::lockForUpdate()->findOrFail($item['inventory_item_id']);

                if ($inv->current_stock < $item['quantity']) {
                    throw new \RuntimeException(
                        "Insufficient global stock for '{$inv->name}'. ".
                        "Available: {$inv->current_stock}, Requested: {$item['quantity']}"
                    );
                }

                // Stock moves out of SA warehouse and into "in-transit" the moment it ships
                $inv->decrement('current_stock', $item['quantity']);
            }

            // ── Step 2: Create dispatch header ───────────────────────────────
            $dispatch = AdminStockDispatch::create([
                'super_admin_id'         => $request->user()->id,
                'admin_id'               => $validated['admin_id'],
                'driver_name'            => $validated['driver_name'],
                'driver_phone'           => $validated['driver_phone'],
                'vehicle_number'         => $validated['vehicle_number'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status'                 => 'DISPATCHED_TO_ADMIN',
                'dispatched_at'          => now(),
                'notes'                  => $validated['notes'] ?? null,
            ]);

            // ── Step 3: Create per-item records ──────────────────────────────
            foreach ($validated['items'] as $item) {
                AdminStockDispatchItem::create([
                    'admin_stock_dispatch_id' => $dispatch->id,
                    'inventory_item_id'       => $item['inventory_item_id'],
                    'dispatched_quantity'     => $item['quantity'],
                    'serial_numbers'          => $item['serial_numbers'] ?? null,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Stock dispatched to Admin successfully.',
        ], 201);
    }

    /**
     * GET /super-admin/stock-dispatches/{id}
     * Full detail of one dispatch with item breakdown and admin info.
     */
    public function show(Request $request, int $id)
    {
        $dispatch = AdminStockDispatch::with(['admin:id,name,mobile', 'items.inventoryItem'])
            ->where('super_admin_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $dispatch]);
    }
}
