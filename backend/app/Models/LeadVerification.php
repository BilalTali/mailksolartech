<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $lead_id
 * @property string $action
 * @property int $performed_by
 * @property string $performer_role
 * @property string|null $reason
 * @property int $revert_count_at_time
 * @property string $created_at
 * @property-read \App\Models\Lead $lead
 * @property-read \App\Models\User $performedBy
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereAction($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereLeadId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification wherePerformedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification wherePerformerRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadVerification whereRevertCountAtTime($value)
 */
class LeadVerification extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    const UPDATED_AT = null;

    protected $fillable = [
        'lead_id',
        'action',
        'performed_by',
        'performer_role',
        'reason',
        'revert_count_at_time',
    ];

    protected function casts(): array
    {
        return [
            'revert_count_at_time' => 'integer',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
