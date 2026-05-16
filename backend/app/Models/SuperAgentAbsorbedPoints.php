<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $super_agent_id
 * @property int $source_agent_id
 * @property int $offer_id
 * @property int|null $lead_id
 * @property float $absorbed_points Number of partial points absorbed (previously calculations used installations)
 * @property float $agent_total_points Agent's total points in this offer at time of absorption
 * @property float $offer_target The target_points of the offer — stored for historical accuracy
 * @property string $absorption_reason
 * @property \Illuminate\Support\Carbon $absorbed_at When the absorption was processed
 * @property string $status unclaimed: SA has not claimed yet · claimed: admin notified · delivered: admin confirmed
 * @property int|null $claimed_by
 * @property \Illuminate\Support\Carbon|null $claimed_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 * @property int|null $approved_by
 * @property string|null $admin_notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SuperAgentAbsorbedPoints extends Model
{
    protected $table = 'super_agent_absorbed_points';

    protected $fillable = [
        'super_agent_id', 'source_agent_id', 'offer_id', 'lead_id',
        'absorbed_points', 'agent_total_points',
        'offer_target', 'absorption_reason', 'absorbed_at',
        'status', 'claimed_by', 'claimed_at', 'delivered_at',
        'approved_by', 'admin_notes',
    ];

    protected $casts = [
        'absorbed_at' => 'datetime',
        'claimed_at' => 'datetime',
        'delivered_at' => 'datetime',
        'absorbed_points' => 'float',
        'agent_total_points' => 'float',
        'offer_target' => 'float',
    ];

    public function superAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'super_agent_id');
    }

    public function sourceAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'source_agent_id');
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }
    
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeUnclaimed(Builder $q): Builder
    {
        return $q->where('status', 'unclaimed');
    }

    public function scopeClaimed(Builder $q): Builder
    {
        return $q->where('status', 'claimed');
    }

    public function scopeForSA(Builder $q, int $saId): Builder
    {
        return $q->where('super_agent_id', $saId);
    }
}
