<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $super_agent_id
 * @property string $capacity
 * @property string $label
 * @property numeric $agent_commission
 * @property numeric $super_agent_override
 * @property numeric $enumerator_commission
 * @property numeric $reward_value
 * @property string|null $description
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $superAgent
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereAgentCommission($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereCapacity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereRewardValue($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereSuperAgentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereSuperAgentOverride($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CommissionSlab whereUpdatedAt($value)
 */
class CommissionSlab extends Model
{
    use HasFactory;

    protected $fillable = ['capacity', 'label', 'agent_commission', 'super_agent_override', 'enumerator_commission', 'description', 'is_active', 'super_agent_id'];

    public function superAgent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'super_agent_id');
    }

    protected function casts(): array
    {
        return [
            'agent_commission' => 'decimal:2',
            'super_agent_override' => 'decimal:2',
            'enumerator_commission' => 'decimal:2',
            'reward_value' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Ordered by capacity
    public static function ordered(): \Illuminate\Database\Eloquent\Collection
    {
        $order = ['1kw', '2kw', '3kw', '4kw', '5kw', '6kw', '7kw', '8kw', '9kw', '10kw'];

        return static::all()->sortBy(fn ($s) => 
            ($pos = array_search($s->capacity, $order)) !== false ? $pos : 999
        )->values();
    }

}
