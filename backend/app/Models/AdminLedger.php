<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminLedger extends Model
{
    protected $fillable = [
        'admin_id',
        'transaction_type',
        'category',
        'amount',
        'description',
        'created_by',
        'receipt_path',
        'status',
        'rejection_reason',
        'payment_method',
        'payment_reference',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    /**
     * The user (super_admin or admin) who created this ledger entry.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The admin this ledger entry belongs to.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
