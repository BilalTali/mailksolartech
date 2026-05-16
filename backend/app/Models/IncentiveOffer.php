<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $super_agent_id
 * @property string $title
 * @property string|null $description
 * @property string $offer_type
 * @property int $target_installs
 * @property numeric|null $reward_value
 * @property \Illuminate\Support\Carbon|null $valid_from
 * @property \Illuminate\Support\Carbon|null $valid_until
 * @property bool $is_active
 * @property string|null $image_url
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $superAgent
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereImageUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereOfferType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereRewardValue($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereSuperAgentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereTargetInstalls($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereValidFrom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|IncentiveOffer whereValidUntil($value)
 */
class IncentiveOffer extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'offer_type', 'target_installs', 'reward_value', 'valid_from', 'valid_until', 'is_active', 'super_agent_id'];

    public function superAgent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'super_agent_id');
    }

    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_until' => 'date',
            'is_active' => 'boolean',
            'reward_value' => 'decimal:2',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
