<?php

namespace App\Http\Requests;

use App\Services\StatusTransitionService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateLeadStatusRequest
 *
 * B3 - Removed the intentional exclusion of SITE_SURVEY and COMPLETED.
 * Admin is now authorised to set ANY status (including those normally
 * set by the Field Technical Team) as a manual override.
 *
 * Additional per-status document requirements (feasibility_report,
 * e_token for REGISTERED) are preserved.
 */
class UpdateLeadStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is handled at the controller level via LeadPolicy
        return true;
    }

    public function rules(): array
    {
        // Build the allowed status list from the canonical service constant.
        // Admin/Operator may transition to ANY status — including SITE_SURVEY
        // and COMPLETED which were previously hard-excluded.
        $allowed = implode(',', StatusTransitionService::ALL_STATUSES);

        $rules = [
            'status' => "required|in:{$allowed}",
            'notes'  => 'nullable|string',
            'receipt'               => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
            'feasibility_report'    => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
            'e_token'               => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
            'additional_document'   => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
            'geotag'                => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png',
            'registration_number'   => 'nullable|string|max:100',
            'installation_scheduled_at' => 'nullable|date',
        ];

        // REGISTERED requires supporting documents.
        if ($this->input('status') === 'REGISTERED') {
            $rules['feasibility_report']  = 'required|file|max:5120|mimes:pdf,jpg,jpeg,png';
            $rules['e_token']             = 'required|file|max:5120|mimes:pdf,jpg,jpeg,png';
            $rules['registration_number'] = 'required|string|max:100';
        }

        \Illuminate\Support\Facades\Log::info("VALIDATION PAYLOAD:", $this->all()); return $rules;
    }
}
