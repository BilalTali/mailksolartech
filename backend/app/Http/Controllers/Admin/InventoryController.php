<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $items = DB::table('inventory_items')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'make' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100|unique:inventory_items,sku',
            'category' => 'required|string|max:100',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'current_stock' => 'integer|min:0',
            'base_price' => 'numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        $id = DB::table('inventory_items')->insertGetId($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory item created successfully.',
            'data' => DB::table('inventory_items')->find($id)
        ]);
    }

    public function show(int $id)
    {
        $item = DB::table('inventory_items')->find($id);

        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item
        ]);
    }

    public function update(Request $request, int $id)
    {
        $item = DB::table('inventory_items')->find($id);

        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'make' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100|unique:inventory_items,sku,' . $id,
            'category' => 'required|string|max:100',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'current_stock' => 'integer|min:0',
            'base_price' => 'numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['updated_at'] = now();

        DB::table('inventory_items')->where('id', $id)->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory item updated successfully.',
            'data' => DB::table('inventory_items')->find($id)
        ]);
    }

    public function destroy(int $id)
    {
        $deleted = DB::table('inventory_items')->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inventory item deleted successfully.'
        ]);
    }

    /**
     * List all lead items that have a reverted quantity pending admin confirmation.
     */
    public function reversionsPending(Request $request)
    {
        $pending = \App\Models\LeadInventoryItem::with(['inventoryItem', 'lead'])
            ->where('reverted_quantity', '>', 0)
            ->whereNull('reversion_confirmed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pending
        ]);
    }

    /**
     * Confirm a material reversion from an installer.
     * Marks the lead item as confirmed and adds quantity back to warehouse stock.
     */
    public function confirmReversion(Request $request, int $leadInventoryItemId)
    {
        DB::transaction(function () use ($leadInventoryItemId, $request) {
            // Re-fetch with a row lock — prevents double-confirmation from concurrent requests
            $item = \App\Models\LeadInventoryItem::lockForUpdate()->findOrFail($leadInventoryItemId);

            if ($item->reversion_confirmed_at) {
                throw new \RuntimeException('Reversion already confirmed.');
            }

            // 1. Mark as confirmed
            $item->update([
                'reversion_confirmed_at' => now(),
                'reversion_confirmed_by' => $request->user()->id,
            ]);

            // 2. Credit back to THIS Admin's personal stock ledger.
            //    Stock originally came from admin_inventory when allocated to the lead,
            //    so it returns there — NOT to the global SA inventory_items table.
            \App\Models\AdminInventory::firstOrCreate(
                [
                    'admin_id'          => $request->user()->id,
                    'inventory_item_id' => $item->inventory_item_id,
                ],
                [
                    'current_stock'  => 0,
                    'total_received' => 0,
                    'total_consumed' => 0,
                    'total_reverted' => 0,
                ]
            );

            // Atomic increment — two counters updated to maintain ledger integrity
            \App\Models\AdminInventory::where('admin_id', $request->user()->id)
                ->where('inventory_item_id', $item->inventory_item_id)
                ->increment('current_stock', $item->reverted_quantity);

            \App\Models\AdminInventory::where('admin_id', $request->user()->id)
                ->where('inventory_item_id', $item->inventory_item_id)
                ->increment('total_reverted', $item->reverted_quantity);
        });

        return response()->json([
            'success' => true,
            'message' => 'Material reversion confirmed and stock returned to your admin inventory.',
        ]);
    }
}
