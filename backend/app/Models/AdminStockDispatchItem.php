<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminStockDispatchItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'serial_numbers'      => 'array',
        'dispatched_quantity' => 'integer',
        'received_quantity'   => 'integer',
    ];

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(AdminStockDispatch::class, 'admin_stock_dispatch_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /** Returns how many units are unaccounted for (dispatched but not received) */
    public function shortfall(): int
    {
        if ($this->received_quantity === null) return $this->dispatched_quantity;
        return max(0, $this->dispatched_quantity - $this->received_quantity);
    }
}
