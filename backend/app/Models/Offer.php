<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string $prize_label
 * @property numeric|null $prize_amount
 * @property string|null $prize_image_path
 * @property \Illuminate\Support\Carbon $offer_from
 * @property \Illuminate\Support\Carbon $offer_to
 * @property int $grace_period_days Days after offer_to that eligible agents can still claim
 * @property int $target_points
 * @property string $offer_type
 * @property string $visible_to
 * @property string $status
 * @property int $current_points
 * @property bool $collective_redeemed
 * @property \Illuminate\Support\Carbon|null $collective_redeemed_at
 * @property int $display_order
 * @property bool $is_featured
 * @property bool $is_annual Visual flag for annual offers (300+ day offers auto-set this)
 * @property \Illuminate\Support\Carbon|null $absorption_processed_at When the expiry absorption job ran for this offer — null = not yet processed
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SuperAgentAbsorbedPoints> $absorbedPoints
 * @property-read int|null $absorbed_points_count
 * @property-read \App\Models\User $createdBy
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\OfferExpiryLog> $expiryLogs
 * @property-read int|null $expiry_logs_count
 * @property-read int $collective_remaining
 * @property-read int $days_remaining
 * @property-read \Carbon\Carbon|null $grace_period_ends_at
 * @property-read bool $is_claimable
 * @property-read bool $is_live
 * @property-read string|null $prize_image_url
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\OfferInstallationLog> $installationLogs
 * @property-read int|null $installation_logs_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\OfferProgress> $progress
 * @property-read int|null $progress_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\OfferRedemption> $redemptions
 * @property-read int|null $redemptions_count
 * @method static Builder<static>|Offer expired()
 * @method static Builder<static>|Offer live()
 * @method static Builder<static>|Offer newModelQuery()
 * @method static Builder<static>|Offer newQuery()
 * @method static Builder<static>|Offer onlyTrashed()
 * @method static Builder<static>|Offer query()
 * @method static Builder<static>|Offer upcoming()
 * @method static Builder<static>|Offer visibleTo(string $role)
 * @method static Builder<static>|Offer whereAbsorptionProcessedAt($value)
 * @method static Builder<static>|Offer whereCollectiveRedeemed($value)
 * @method static Builder<static>|Offer whereCollectiveRedeemedAt($value)
 * @method static Builder<static>|Offer whereCreatedAt($value)
 * @method static Builder<static>|Offer whereCreatedBy($value)
 * @method static Builder<static>|Offer whereCurrentPoints($value)
 * @method static Builder<static>|Offer whereDeletedAt($value)
 * @method static Builder<static>|Offer whereDescription($value)
 * @method static Builder<static>|Offer whereDisplayOrder($value)
 * @method static Builder<static>|Offer whereGracePeriodDays($value)
 * @method static Builder<static>|Offer whereId($value)
 * @method static Builder<static>|Offer whereIsAnnual($value)
 * @method static Builder<static>|Offer whereIsFeatured($value)
 * @method static Builder<static>|Offer whereOfferFrom($value)
 * @method static Builder<static>|Offer whereOfferTo($value)
 * @method static Builder<static>|Offer whereOfferType($value)
 * @method static Builder<static>|Offer wherePrizeAmount($value)
 * @method static Builder<static>|Offer wherePrizeImagePath($value)
 * @method static Builder<static>|Offer wherePrizeLabel($value)
 * @method static Builder<static>|Offer whereStatus($value)
 * @method static Builder<static>|Offer whereTargetPoints($value)
 * @method static Builder<static>|Offer whereTitle($value)
 * @method static Builder<static>|Offer whereUpdatedAt($value)
 * @method static Builder<static>|Offer whereVisibleTo($value)
 * @method static Builder<static>|Offer withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|Offer withoutTrashed()
 */
class Offer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'description', 'prize_label', 'prize_amount', 'prize_image_path',
        'offer_from', 'offer_to', 'target_points', 'offer_type',
        'visible_to', 'status', 'current_points',
        'collective_redeemed', 'collective_redeemed_at',
        'display_order', 'is_featured', 'created_by',
        'grace_period_days', 'is_annual', 'absorption_processed_at',
    ];

    protected $casts = [
        'offer_from' => 'date',
        'offer_to' => 'date',
        'prize_amount' => 'decimal:2',
        'is_featured' => 'boolean',
        'collective_redeemed' => 'boolean',
        'collective_redeemed_at' => 'datetime',
        'current_points' => 'decimal:2',
        'target_points' => 'decimal:2',
        'is_annual' => 'boolean',
        'absorption_processed_at' => 'datetime',
        'grace_period_days' => 'integer',
    ];

    /** @return HasMany<OfferProgress, $this> */
    public function progress(): HasMany
    {
        return $this->hasMany(OfferProgress::class);
    }

    /** @return HasMany<OfferRedemption, $this> */
    public function redemptions(): HasMany
    {
        return $this->hasMany(OfferRedemption::class);
    }

    public function installationLogs(): HasMany
    {
        return $this->hasMany(OfferInstallationLog::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function absorbedPoints(): HasMany
    {
        return $this->hasMany(SuperAgentAbsorbedPoints::class);
    }

    public function expiryLogs(): HasMany
    {
        return $this->hasMany(OfferExpiryLog::class);
    }

    // Scopes
    public function scopeLive(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('status', 'active'))
            ->whereDate('offer_from', '<=', today())
            ->whereDate('offer_to', '>=', today());
    }

    public function scopeVisibleTo(Builder $q, string $role): Builder
    {
        // 'agent' role sees: visible_to IN ('agents', 'both')
        // 'super_agent' role sees: visible_to IN ('super_agents', 'both')
        // These are SEPARATE — super agents do NOT see 'agents'-only offers
        $allowed = match ($role) {
            'agent', 'enumerator' => ['agents', 'both'],
            'super_agent' => ['super_agents', 'both'],
            'admin' => ['agents', 'super_agents', 'both'],
            default => [],
        };

        return $q->whereIn('visible_to', $allowed);
    }

    public function scopeUpcoming(Builder $q): Builder
    {
        return $q->whereDate('offer_from', '>', today());
    }

    public function scopeExpired(Builder $q): Builder
    {
        return $q->whereDate('offer_to', '<', today());
    }

    public function scopeIndividual(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('offer_type', 'individual'));
    }

    public function scopeCollective(Builder $q): Builder
    {
        return $q->where(fn ($q) => $q->where('offer_type', 'collective'));
    }

    // Accessors
    public function getIsLiveAttribute(): bool
    {
        return $this->status === 'active'
            && today()->between($this->offer_from, $this->offer_to);
    }

    public function getDaysRemainingAttribute(): int
    {
        return $this->getIsLiveAttribute() ? max(0, (int) today()->diffInDays($this->offer_to, false)) : 0;
    }

    public function getPrizeImageUrlAttribute(): ?string
    {
        return $this->prize_image_path ? asset('storage/'.$this->prize_image_path) : null;
    }

    // For collective: installations left until team prize
    public function getCollectiveRemainingAttribute(): float
    {
        return max(0, $this->target_points - $this->current_points);
    }

    public function getGracePeriodEndsAtAttribute(): ?\Carbon\Carbon
    {
        return $this->offer_to?->copy()->addDays($this->grace_period_days);
    }

    public function getIsClaimableAttribute(): bool
    {
        return $this->status === 'active'
            && now()->lte($this->grace_period_ends_at ?? $this->offer_to);
    }

    // Annual detection — auto-flag if duration >= 300 days:
    protected static function booted(): void
    {
        static::saving(function (Offer $offer) {
            if ($offer->offer_from && $offer->offer_to) {
                // For Eloquent models, offer_from/to are likely still Carbon objects if they are being saved
                // but diffInDays on Carbon should work.
                $days = $offer->offer_from->diffInDays($offer->offer_to);
                $offer->is_annual = $days >= 300;
            }
        });
    }

    protected $appends = [
        'is_live', 'days_remaining', 'prize_image_url',
        'collective_remaining', 'grace_period_ends_at', 'is_claimable',
    ];
}
