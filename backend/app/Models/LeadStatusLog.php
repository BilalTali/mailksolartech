<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $lead_id
 * @property int|null $changed_by
 * @property string|null $from_status
 * @property string|null $to_status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $changedBy
 * @property-read \App\Models\Lead $lead
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereChangedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereFromStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereLeadId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereToStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadStatusLog whereUpdatedAt($value)
 */
class LeadStatusLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 
        'changed_by', 
        'from_status', 
        'to_status', 
        'notes',
        'metadata',
        'geotag_photo_path',
        'latitude',
        'longitude',
        'changed_by_role'
    ];

    protected $hidden = ['lead'];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
