<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadInventoryItem extends Model
{
    protected $fillable = [
        'lead_id',
        'inventory_item_id',
        'quantity',
        'consumed_quantity',
        'reverted_quantity',
        'serial_number',
        'dispatched_by',
        'dispatched_at',
        'reversion_confirmed_by',
        'reversion_confirmed_at',
        'notes',
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'reversion_confirmed_at' => 'datetime',
        'quantity' => 'integer',
        'consumed_quantity' => 'integer',
        'reverted_quantity' => 'integer',
    ];

    public function isReversionPending(): bool
    {
        return $this->reverted_quantity > 0 && !$this->reversion_confirmed_at;
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
