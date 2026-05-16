<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // Import the Rule facade

class StoreAgentLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['agent', 'enumerator']);
    }

    public function rules(): array
    {
        return [
            // Beneficiary Info
            'beneficiary_name' => 'required|string|max:255',
            'beneficiary_mobile' => 'required|string|size:10|regex:/^[6-9]\d{9}$/',
            'beneficiary_email' => 'nullable|email',
            'beneficiary_state' => ['required', 'string', Rule::in(['Jammu & Kashmir', 'Ladakh'])],
            'beneficiary_district' => ['required', 'string', Rule::in([
                'Srinagar', 'Baramulla', 'Anantnag', 'Pulwama', 'Kupwara', 'Budgam',
                'Bandipora', 'Bandipore', 'Ganderbal', 'Kulgam', 'Shopian',
                'Jammu', 'Kathua', 'Udhampur', 'Reasi', 'Samba', 'Rajouri',
                'Poonch', 'Doda', 'Ramban', 'Kishtwar',
                'Leh', 'Kargil',
            ])],
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
            'admin_notes' => 'nullable|string', // Reusing this field to hold initial agent notes to admin

            // File Uploads — Aadhaar, electricity bill, and photo are required (5MB limit)
            'aadhaar_front' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'aadhaar_back' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'electricity_bill' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'photo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'other' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'solar_roof_photo' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'bank_passbook' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'consumer_signature' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            // Bank Details (QW-2)
            'beneficiary_bank_account' => 'nullable|string|max:255',
            'beneficiary_bank_ifsc'    => 'nullable|string|max:20',
            'beneficiary_bank_branch'  => 'nullable|string|max:100',
            'beneficiary_bank_name'    => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'aadhaar_front.required' => 'Aadhaar front side upload is required.',
            'aadhaar_back.required' => 'Aadhaar back side upload is required.',
            'electricity_bill.required' => 'Electricity bill upload is required.',
            'photo.required' => 'Beneficiary photo is required.',
            'beneficiary_state.in' => 'State must be Jammu & Kashmir or Ladakh.',
            'beneficiary_district.in' => 'Please select a valid district.',
            'beneficiary_mobile.regex' => 'Mobile number must start with 6, 7, 8, or 9.',
        ];
    }

    public function attributes(): array
    {
        return [
            'other' => 'PAN Card',
        ];
    }
}
