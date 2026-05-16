<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstallationDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorized in policy/controller
    }

    public function rules(): array
    {
        if ($this->has('checklist_only') && $this->boolean('checklist_only')) {
            return [
                'inventory_reconciliation' => 'required|json',
                'latitude'                 => 'required|numeric',
                'longitude'                => 'required|numeric',
                'agreed_to_terms'          => 'required|accepted',
            ];
        }

        return [
            // Required Text Fields
            'make_panel' => 'required|string|max:100',
            'serial_number_panel' => 'required|string|max:100',
            'make_inverter' => 'required|string|max:100',
            'serial_number_inverter' => 'required|string|max:100',
            'serial_number_la' => 'required|string|max:100',

            // GPS (applied globally)
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',

            // Checkbox
            'agreed_to_terms' => 'required|accepted',

            // Images (8 required slots)
            'image_geo_material' => 'required|image|max:10240',
            'image_geo_panel_serial' => 'required|image|max:10240',
            'image_geo_erected_la' => 'required|image|max:10240',
            'image_geo_earthing' => 'required|image|max:10240',
            'image_geo_inverter_serial' => 'required|image|max:10240',
            'image_agreement_consumer' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'image_loan_statement' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'image_geo_consumer_inverter' => 'required|image|max:10240',
            'inventory_reconciliation' => 'sometimes|json',

            // Annexure B fields (Optional)
            'inverter_rating' => 'nullable|string|max:200',
            'remote_monitoring_configured' => 'nullable|boolean',
            'dcdb_rating' => 'nullable|string|max:200',
            'acdb_rating' => 'nullable|string|max:200',
            'dc_wire_type' => 'nullable|string|max:200',
            'dc_wire_size' => 'nullable|string|max:200',
            'ac_wire_type' => 'nullable|string|max:200',
            'ac_wire_size' => 'nullable|string|max:200',
            'earth_wire_type' => 'nullable|string|max:200',
            'earth_wire_size' => 'nullable|string|max:200',
        ];
    }
}
