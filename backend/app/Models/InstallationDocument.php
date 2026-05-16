<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class InstallationDocument extends Model
{
    protected $table = 'installation_documents';
    protected $guarded = [];
    protected $appends = ['signed_url', 'document_label'];

    /** Human-readable labels for each document key submitted by the installer. */
    private const DOCUMENT_LABELS = [
        'geo_material'          => 'Geotagged: Material at Site',
        'geo_panel_serial'      => 'Geotagged: Panel Serial No.',
        'geo_erected_la'        => 'Geotagged: Erected Lightning Arrester',
        'geo_earthing'          => 'Geotagged: Earthing',
        'geo_inverter_serial'   => 'Geotagged: Inverter Serial No.',
        'agreement_consumer'    => 'Consumer Agreement',
        'loan_statement'        => 'Loan Statement',
        'geo_consumer_inverter' => 'Geotagged: Consumer & Inverter',
    ];

    /** Temporary signed URL (120 min) for viewing this document in the browser. */
    public function getSignedUrlAttribute(): ?string
    {
        $lead = Lead::query()->find($this->lead_id);
        if (! $lead) return null;

        return URL::temporarySignedRoute(
            'leads.installation-documents.signed-view',
            now()->addMinutes(120),
            ['ulid' => $lead->ulid, 'id' => $this->id]
        );
    }

    /** Returns the human-readable label for this document_key. */
    public function getDocumentLabelAttribute(): string
    {
        return self::DOCUMENT_LABELS[$this->document_key] ?? ucwords(str_replace('_', ' ', $this->document_key ?? ''));
    }
}
