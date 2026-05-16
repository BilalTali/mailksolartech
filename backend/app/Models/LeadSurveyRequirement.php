<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadSurveyRequirement extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'system_capacity_kw' => 'decimal:2',
        'wire_length_meters' => 'decimal:2',
        'earthing_kit_required' => 'boolean',
        'lightning_arrester_required' => 'boolean',
        'remote_monitoring_configured' => 'boolean',
        'additional_accessories' => 'array',
        'signed_off' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
