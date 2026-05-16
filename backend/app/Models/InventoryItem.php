<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = [
        'name',
        'make',
        'sku',
        'category',
        'unit',
        'description',
        'current_stock',
        'base_price',
        'is_active',
    ];

    protected $casts = [
        'base_price' => 'float',
        'current_stock' => 'integer',
        'is_active' => 'boolean',
    ];
}
