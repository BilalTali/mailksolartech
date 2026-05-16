<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $lead_id
 * @property string $document_type
 * @property string $file_path
 * @property string $original_filename
 * @property int|null $uploaded_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $download_url
 * @property-read \App\Models\Lead $lead
 * @property-read \App\Models\User|null $uploadedBy
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereDocumentType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereLeadId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereOriginalFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeadDocument whereUploadedBy($value)
 */
class LeadDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'document_type', 'file_path', 'original_filename', 'uploaded_by',
        'visible_to_downline', 'uploaded_by_role',
    ];

    protected $appends = ['download_url'];
    protected $hidden = ['lead'];

    public function getDownloadUrlAttribute(): string
    {
        // Force the URL scheme to check if we are behind a proxy
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'api.v1.leads.documents.signed-view',
            now()->addMinutes(120),
            [
                'ulid' => $this->lead->ulid,
                'id' => $this->id,
                'disposition' => 'attachment',
                'v' => time() // Cache busting
            ]
        );

        if (str_starts_with($url, 'http://') && env('APP_ENV') === 'production') {
            $url = str_replace('http://', 'https://', $url);
        }

        return $url;
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
