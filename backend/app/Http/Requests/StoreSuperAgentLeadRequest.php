<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSuperAgentLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'super_agent';
    }

    public function rules(): array
    {
        return [
            // Beneficiary Info
            'beneficiary_name' => 'required|string|max:255',
            'beneficiary_mobile' => 'required|string|size:10|regex:/^[6-9]\d{9}$/',
            'beneficiary_email' => 'required|email|max:255',
            'beneficiary_state' => 'required|string|max:255',
            'beneficiary_district' => 'required|string|max:255',
            'beneficiary_address' => 'required|string',
            'beneficiary_pincode' => 'required|string|size:6',

            // Technical Info
            'consumer_number' => ['required', 'string', 'max:100', new \App\Rules\GloballyUniqueConsumerNumber],
            'discom_name' => 'required|string|max:100',
            'monthly_bill_amount' => 'required|numeric|min:0',
            'roof_size' => 'required|in:less_100,100_200,200_300,300_plus',
            'system_capacity' => 'required|in:1kw,2kw,3kw,3.3kw,4kw,5kw,5.5kw,6kw,7kw,8kw,9kw,10kw,above_10kw,above_3kw',
            'category' => 'nullable|in:APL,BPL,AAY,OTHER',

            // Notes
            'query_message' => 'nullable|string',

            // Assign to an agent on SA's team (optional – can be left unassigned)
            'agent_id' => 'nullable|exists:users,id',

            // File Uploads
            'aadhaar_front' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'aadhaar_back' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'electricity_bill' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'photo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'other' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'solar_roof_photo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'bank_passbook' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'consumer_signature' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',

            // Bank Details
            'beneficiary_bank_account' => 'required|string|max:255',
            'beneficiary_bank_ifsc'    => 'required|string|max:20',
            'beneficiary_bank_branch'  => 'required|string|max:100',
            'beneficiary_bank_name'    => 'required|string|max:100',
        ];
    }
}
