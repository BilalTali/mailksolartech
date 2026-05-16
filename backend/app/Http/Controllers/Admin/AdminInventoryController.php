<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminInventory;
use App\Models\AdminStockDispatch;
use App\Models\AdminStockDispatchItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminInventoryController extends Controller
{
    /**
     * GET /admin/inventory/my-stock
     * Show this admin's current personal stock ledger.
     * Accessible to: admin, operator
     */
    public function index(Request $request)
    {
        $stock = AdminInventory::with('inventoryItem')
            ->where('admin_id', $request->user()->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($row) => [
                'id'              => $row->id,
                'inventory_item'  => $row->inventoryItem,
                'current_stock'   => $row->current_stock,
                'total_received'  => $row->total_received,
                'total_consumed'  => $row->total_consumed,
                'total_reverted'  => $row->total_reverted,
            ]);

        return response()->json(['success' => true, 'data' => $stock]);
    }

    /**
     * GET /admin/inventory/incoming
     * List all pending dispatches from Super Admin awaiting confirmation.
     * Accessible to: admin, operator
     */
    public function incomingStock(Request $request)
    {
        $pending = AdminStockDispatch::with(['superAdmin:id,name', 'items.inventoryItem'])
            ->where('admin_id', $request->user()->id)
            ->where('status', 'DISPATCHED_TO_ADMIN')
            ->latest('dispatched_at')
            ->get();

        return response()->json(['success' => true, 'data' => $pending]);
    }

    /**
     * POST /admin/inventory/incoming/{id}/confirm
     * Admin confirms receipt of a Super Admin dispatch.
     *
     * For each item: enters received_quantity + condition.
     * If received_quantity < dispatched_quantity → dispatch flagged as PARTIALLY_RECEIVED.
     * Received stock is credited to admin_inventory atomically.
     *
     * Accessible to: admin only (operators can view, not confirm)
     */
    public function confirmReceipt(Request $request, int $id)
    {
        $validated = $request->validate([
            'items'                             => 'required|array|min:1',
            'items.*.dispatch_item_id'          => 'required|exists:admin_stock_dispatch_items,id',
            'items.*.received_quantity'         => 'required|integer|min:0',
            'items.*.condition'                 => 'required|in:good,damaged,missing',
            'items.*.notes'                     => 'nullable|string|max:500',
            'geo_photo'                         => 'required|image|max:10240',
            'latitude'                          => 'required|numeric',
            'longitude'                         => 'required|numeric',
            'notes'                             => 'nullable|string|max:1000',
        ]);

        /** @var \App\Models\AdminStockDispatch $dispatch */
        $dispatch = AdminStockDispatch::with('items')
            ->where('admin_id', $request->user()->id)
            ->findOrFail($id);

        // Guard: prevent double-confirmation
        if ($dispatch->isReceived()) {
            return response()->json([
                'success' => false,
                'message' => 'This dispatch has already been confirmed.',
            ], 422);
        }

        // Store geo proof photo
        $geoPhotoPath = $request->file('geo_photo')->store('admin_receipts', 'public');

        $isPartial = false;

        try {
            DB::transaction(function () use ($validated, $dispatch, $request, &$isPartial) {
                foreach ($validated['items'] as $itemData) {
                    // Row lock prevents concurrent double-credit
                    $dispatchItem = AdminStockDispatchItem::lockForUpdate()
                        ->findOrFail($itemData['dispatch_item_id']);

                    // Verify this item belongs to this dispatch
                    if ($dispatchItem->admin_stock_dispatch_id !== $dispatch->id) {
                        throw new \RuntimeException('Item does not belong to this dispatch.');
                    }

                    // Detect partial receipt (some items missing/damaged)
                    if ($itemData['received_quantity'] < $dispatchItem->dispatched_quantity) {
                        $isPartial = true;
                    }

                    // Update the dispatch item with receipt details
                    $dispatchItem->update([
                        'received_quantity' => $itemData['received_quantity'],
                        'condition'         => $itemData['condition'],
                        'notes'             => $itemData['notes'] ?? null,
                    ]);

                    // Credit admin_inventory only for items actually received
                    if ($itemData['received_quantity'] > 0) {
                        // UPSERT: one row per (admin_id, inventory_item_id)
                        AdminInventory::firstOrCreate(
                            [
                                'admin_id'          => $dispatch->admin_id,
                                'inventory_item_id' => $dispatchItem->inventory_item_id,
                            ],
                            [
                                'current_stock'  => 0,
                                'total_received' => 0,
                                'total_consumed' => 0,
                                'total_reverted' => 0,
                            ]
                        );

                        // Atomic increments — stock credited to admin's personal ledger
                        AdminInventory::where('admin_id', $dispatch->admin_id)
                            ->where('inventory_item_id', $dispatchItem->inventory_item_id)
                            ->increment('current_stock', $itemData['received_quantity']);

                        AdminInventory::where('admin_id', $dispatch->admin_id)
                            ->where('inventory_item_id', $dispatchItem->inventory_item_id)
                            ->increment('total_received', $itemData['received_quantity']);
                    }
                }

                // Update dispatch header status and close out
                $dispatch->update([
                    'status'      => $isPartial ? 'PARTIALLY_RECEIVED' : 'RECEIVED_BY_ADMIN',
                    'received_at' => now(),
                    'notes'       => trim(($dispatch->notes ? $dispatch->notes . "\n" : '') . ($validated['notes'] ?? '')),
                ]);
            });
        } catch (\Exception $e) {
            Storage::disk('public')->delete($geoPhotoPath);
            return response()->json([
                'success' => false,
                'message' => 'Receipt confirmation failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => $isPartial
                ? 'Receipt confirmed with shortfalls. Super Admin has been flagged.'
                : 'Full receipt confirmed. Stock credited to your inventory.',
            'status'  => $isPartial ? 'PARTIALLY_RECEIVED' : 'RECEIVED_BY_ADMIN',
        ]);
    }
}
