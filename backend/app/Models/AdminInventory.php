<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminInventory extends Model
{
    protected $table = 'admin_inventory';

    protected $guarded = ['id'];

    protected $casts = [
        'current_stock'  => 'integer',
        'total_received' => 'integer',
        'total_consumed' => 'integer',
        'total_reverted' => 'integer',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Safely decrement admin stock when allocating items to a Lead.
     * Uses atomic increment to prevent race conditions — always call inside a DB::transaction.
     *
     * @throws \RuntimeException if insufficient stock
     */
    public function deduct(int $qty): void
    {
        // Re-fetch with a row lock to prevent concurrent over-allocation
        $fresh = static::lockForUpdate()->findOrFail($this->id);

        if ($fresh->current_stock < $qty) {
            $name = $fresh->inventoryItem?->name ?? "Item #{$fresh->inventory_item_id}";
            throw new \RuntimeException(
                "Insufficient admin stock for '{$name}'. Available: {$fresh->current_stock}, Requested: {$qty}"
            );
        }

        // Atomic decrement — two counters updated together
        $fresh->decrement('current_stock', $qty);
        $fresh->increment('total_consumed', $qty);
    }

    /**
     * Credit stock back to admin ledger (called when Admin confirms a technician reversion).
     * Always call inside a DB::transaction with lockForUpdate on the parent record.
     */
    public function credit(int $qty): void
    {
        $this->increment('current_stock', $qty);
        $this->increment('total_reverted', $qty);
    }
}
