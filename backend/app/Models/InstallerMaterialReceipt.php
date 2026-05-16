<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallerMaterialReceipt extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'items_received' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installer_id');
    }
}
