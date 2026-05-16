<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTechnicalVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'technician_id',
        'visit_type',
        'selfie_url',
        'latitude',
        'longitude',
        'terms_agreed_at'
    ];

    protected function casts(): array
    {
        return [
            'terms_agreed_at' => 'datetime',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
