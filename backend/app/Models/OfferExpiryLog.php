<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $offer_id
 * @property int $agents_processed
 * @property int $agents_absorbed
 * @property int $agents_grace_period_expired
 * @property int $total_points_absorbed
 * @property int $total_points_discarded
 * @property array<array-key, mixed>|null $agent_breakdown
 * @property \Illuminate\Support\Carbon $processed_at
 * @property-read \App\Models\Offer $offer
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereAgentBreakdown($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereAgentsAbsorbed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereAgentsGracePeriodExpired($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereAgentsProcessed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereOfferId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereProcessedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereTotalPointsAbsorbed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferExpiryLog whereTotalPointsDiscarded($value)
 */
class OfferExpiryLog extends Model
{
    public $timestamps = false; // We use processed_at

    protected $fillable = [
        'offer_id',
        'agents_processed',
        'agents_absorbed',
        'agents_grace_period_expired',
        'total_points_absorbed',
        'total_points_discarded',
        'agent_breakdown',
        'processed_at',
    ];

    protected $casts = [
        'agent_breakdown' => 'array',
        'processed_at' => 'datetime',
        'agents_processed' => 'integer',
        'agents_absorbed' => 'integer',
        'agents_grace_period_expired' => 'integer',
        'total_points_absorbed' => 'integer',
        'total_points_discarded' => 'integer',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }
}
