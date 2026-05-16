<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $super_agent_id
 * @property int $agent_id
 * @property int $assigned_by
 * @property \Illuminate\Support\Carbon $assigned_at
 * @property \Illuminate\Support\Carbon|null $unassigned_at
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $agent
 * @property-read \App\Models\User $assignedBy
 * @property-read \App\Models\User $superAgent
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereAgentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereAssignedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereAssignedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereSuperAgentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereUnassignedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SuperAgentTeamLog whereUpdatedAt($value)
 */
class SuperAgentTeamLog extends Model
{
    protected $fillable = [
        'super_agent_id',
        'agent_id',
        'assigned_by',
        'assigned_at',
        'unassigned_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'unassigned_at' => 'datetime',
        ];
    }

    public function superAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'super_agent_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
