<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $lead_id
 * @property int $payee_id
 * @property string $payee_role
 * @property float|int $amount
 * @property int $entered_by
 * @property string $payment_status
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property string|null $approved_at
 * @property int|null $paid_by
 * @property string|null $payment_method
 * @property string|null $payment_reference
 * @property string|null $payment_notes
 * @property \Illuminate\Support\Carbon|null $locked_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property int|null $approved_by
 * @property string|null $rejected_at
 * @property int|null $rejected_by
 * @property string|null $rejection_reason
 * @property-read \App\Models\User $enteredBy
 * @property-read \App\Models\Lead $lead
 * @property-read \App\Models\User|null $paidBy
 * @property-read \App\Models\User $payee
 * @method static Builder<static>|Commission forAgents()
 * @method static Builder<static>|Commission forPayee(int $userId)
 * @method static Builder<static>|Commission forSuperAgents()
 * @method static Builder<static>|Commission newModelQuery()
 * @method static Builder<static>|Commission newQuery()
 * @method static Builder<static>|Commission onlyTrashed()
 * @method static Builder<static>|Commission paid()
 * @method static Builder<static>|Commission query()
 * @method static Builder<static>|Commission unpaid()
 * @method static Builder<static>|Commission whereAmount($value)
 * @method static Builder<static>|Commission whereApprovedAt($value)
 * @method static Builder<static>|Commission whereApprovedBy($value)
 * @method static Builder<static>|Commission whereCreatedAt($value)
 * @method static Builder<static>|Commission whereDeletedAt($value)
 * @method static Builder<static>|Commission whereEnteredBy($value)
 * @method static Builder<static>|Commission whereId($value)
 * @method static Builder<static>|Commission whereLeadId($value)
 * @method static Builder<static>|Commission whereLockedAt($value)
 * @method static Builder<static>|Commission wherePaidAt($value)
 * @method static Builder<static>|Commission wherePaidBy($value)
 * @method static Builder<static>|Commission wherePayeeId($value)
 * @method static Builder<static>|Commission wherePayeeRole($value)
 * @method static Builder<static>|Commission wherePaymentMethod($value)
 * @method static Builder<static>|Commission wherePaymentNotes($value)
 * @method static Builder<static>|Commission wherePaymentReference($value)
 * @method static Builder<static>|Commission wherePaymentStatus($value)
 * @method static Builder<static>|Commission whereRejectedAt($value)
 * @method static Builder<static>|Commission whereRejectedBy($value)
 * @method static Builder<static>|Commission whereRejectionReason($value)
 * @method static Builder<static>|Commission whereUpdatedAt($value)
 * @method static Builder<static>|Commission withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|Commission withoutTrashed()
 */
class Commission extends Model
{
    use SoftDeletes;

    protected $table = 'commissions';

    protected $fillable = [
        'lead_id', 'payee_id', 'payee_role', 'amount',
        'entered_by', 'payment_status', 'paid_at', 'paid_by',
        'payment_method', 'payment_reference', 'payment_notes', 'locked_at',
        'trigger_status', 'triggered_at', 'chain_type', 'hierarchy_level',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    protected $hidden = ['lead'];

    // ── Relationships ─────────────────────────────────────────────────
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function payee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payee_id');
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────
    public function scopeForSuperAgents(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payee_role', 'super_agent'));
    }

    public function scopeForAgents(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payee_role', 'agent'));
    }

    public function scopeForEnumerators(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payee_role', 'enumerator'));
    }

    public function scopeForTechnicians(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payee_role', 'field_technical_team'));
    }

    public function scopeUnpaid(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payment_status', 'unpaid'));
    }

    public function scopePaid(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('payment_status', 'paid'));
    }

    public function scopeForPayee(Builder $q, int $userId): Builder
    {
        return $q->where(fn ($q) => $q->where('payee_id', $userId));
    }

    public function scopeForPayer(Builder $q, int $userId): Builder
    {
        return $q->where(fn ($q) => $q->where('entered_by', $userId));
    }

    // ── Helper Methods ────────────────────────────────────────────────
    public function isLocked(): bool
    {
        // Commission is locked if it is already paid OR it was created more than 24 hours ago
        return $this->isPaid() || ($this->created_at && $this->created_at->addHours(24)->isPast());
    }

    public function isForSuperAgent(): bool
    {
        return $this->payee_role === 'super_agent';
    }

    public function isForAgent(): bool
    {
        return $this->payee_role === 'agent';
    }

    public function isForEnumerator(): bool
    {
        return $this->payee_role === 'enumerator';
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }
}
