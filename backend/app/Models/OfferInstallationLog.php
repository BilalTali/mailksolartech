<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $offer_id
 * @property int $user_id
 * @property int $lead_id
 * @property \Illuminate\Support\Carbon $installed_at
 * @property-read \App\Models\Lead $lead
 * @property-read \App\Models\Offer $offer
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog whereInstalledAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog whereLeadId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog whereOfferId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|OfferInstallationLog whereUserId($value)
 */
class OfferInstallationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'offer_id', 'user_id', 'lead_id', 'points_awarded', 'points_awarded_to_agent', 'installed_at',
    ];

    protected $casts = [
        'installed_at' => 'datetime',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
