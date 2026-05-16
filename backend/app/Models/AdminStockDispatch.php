<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminStockDispatch extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'dispatched_at'          => 'datetime',
        'received_at'            => 'datetime',
        'expected_delivery_date' => 'date',
    ];

    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'super_admin_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(\App\Models\AdminStockDispatchItem::class);
    }

    /** True if the Admin has not yet confirmed receipt */
    public function isPending(): bool
    {
        return $this->status === 'DISPATCHED_TO_ADMIN';
    }

    /** True if fully or partially received */
    public function isReceived(): bool
    {
        return in_array($this->status, ['RECEIVED_BY_ADMIN', 'PARTIALLY_RECEIVED'], true);
    }
}
