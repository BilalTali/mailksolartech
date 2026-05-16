<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $offer_id
 * @property int $user_id
 * @property string $role_context Role in which this user is participating — super agents participating
 *                              as agents have role_context=super_agent to distinguish from agent rows
 * @property int $total_points
 * @property int $redeemed_points
 * @property int $redemption_count
 * @property int $unredeemed_points
 * @property bool $can_redeem
 * @property int $pending_redemption_count
 * @property \Illuminate\Support\Carbon|null $first_installation_at
 * @property \Illuminate\Support\Carbon|null $last_installation_at
 * @property \Illuminate\Support\Carbon|null $last_redeemed_at
 * @property \Illuminate\Support\Carbon|null $offer_ended_zeroed_at When this progress was zeroed on offer expiry for UI display
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\SuperAgentAbsorbedPoints|null $absorbedPoints
 * @property-read \App\Models\Offer $offer
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereCanRedeem($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereFirstInstallationAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereLastInstallationAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereLastRedeemedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereOfferEndedZeroedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereOfferId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress wherePendingRedemptionCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereRedeemedPoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereRedemptionCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereRoleContext($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereTotalPoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereUnredeemedPoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferProgress whereUserId($value)
 */
class OfferProgress extends Model
{
    protected $table = 'offer_progress';

    protected $fillable = [
        'offer_id', 'user_id', 'role_context',
        'total_points', 'redeemed_points', 'redemption_count',
        'unredeemed_points', 'can_redeem', 'pending_redemption_count',
        'first_installation_at', 'last_installation_at', 'last_redeemed_at',
        'offer_ended_zeroed_at',
    ];

    protected $casts = [
        'can_redeem' => 'boolean',
        'first_installation_at' => 'datetime',
        'last_installation_at' => 'datetime',
        'last_redeemed_at' => 'datetime',
        'total_points' => 'float',
        'redeemed_points' => 'float',
        'redemption_count' => 'integer',
        'unredeemed_points' => 'float',
        'pending_redemption_count' => 'integer',
        'offer_ended_zeroed_at' => 'datetime',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasOne<SuperAgentAbsorbedPoints, $this> */
    public function absorbedPoints()
    {
        return $this->hasOne(SuperAgentAbsorbedPoints::class, 'source_agent_id', 'user_id')
            ->where(fn ($q) => $q->where('offer_id', $this->offer_id));
    }

    /**
     * Recalculate all derived fields from raw counters.
     * Call this after any change to total_installations or redeemed_installations.
     */
    public function recalculate(): void
    {
        $target = $this->offer->target_points;

        if ($target <= 0) {
            return;
        }

        // Absorption is handled upstream in OfferService::processPoints().
        // total_points already reflects only what this user actually received.
        $unredeemed = max(0, (float)$this->total_points - (float)$this->redeemed_points);

        $this->update([
            'unredeemed_points'        => $unredeemed,
            'can_redeem'               => $target > 0 && $unredeemed >= $target,
            'pending_redemption_count' => $target > 0 ? (int) floor($unredeemed / $target) : 0,
        ]);
    }

    public function getCanRedeemAttribute(): bool
    {
        return $this->unredeemed_points >= $this->offer->target_points;
    }

    public function getClaimableCountAttribute(): int
    {
        $target = $this->offer->target_points;
        return $target > 0 ? (int) floor($this->unredeemed_points / $target) : 0;
    }

    public function isCompleted(): bool
    {
        // Check if they currently have enough UNREDEEMED points to claim
        return $this->unredeemed_points >= $this->offer->target_points;
    }
}
