<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $offer_id
 * @property int $user_id
 * @property int $redemption_number
 * @property int $points_used
 * @property string $status
 * @property string|null $notes
 * @property int|null $admin_approved_by
 * @property \Illuminate\Support\Carbon|null $admin_approved_at
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 * @property \Illuminate\Support\Carbon $claimed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $approvedBy
 * @property-read \App\Models\User|null $adminApprovedBy
 * @property-read \App\Models\Offer $offer
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereClaimedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereDeliveredAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption wherePointsUsed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereOfferId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereRedemptionNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferRedemption whereUserId($value)
 */
class OfferRedemption extends Model
{
    protected $fillable = [
        'offer_id', 'user_id', 'redemption_number', 'points_used',
        'status', 'notes', 'approved_by', 'approved_at', 'admin_approved_by', 'admin_approved_at', 'delivered_at', 'claimed_at',
    ];

    protected $casts = [
        'admin_approved_at' => 'datetime',
        'approved_at' => 'datetime',
        'delivered_at' => 'datetime',
        'claimed_at' => 'datetime',
        'redemption_number' => 'integer',
        'points_used' => 'integer',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function adminApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_approved_by');
    }
}
