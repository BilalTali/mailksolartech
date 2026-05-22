<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // Import Rule

class StorePublicLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'beneficiary_name' => 'required|string|max:255',
            'beneficiary_mobile' => 'required|string|size:10|regex:/^[6-9]\d{9}$/',
            'beneficiary_email' => 'nullable|email|max:255',
            'beneficiary_state' => ['required', 'string', Rule::in(['Jammu & Kashmir', 'Ladakh'])],
            'beneficiary_district' => ['required', 'string', Rule::in([
                'Srinagar', 'Baramulla', 'Anantnag', 'Pulwama', 'Kupwara', 'Budgam',
                'Bandipora', 'Bandipore', 'Ganderbal', 'Kulgam', 'Shopian',
                'Jammu', 'Kathua', 'Udhampur', 'Reasi', 'Samba', 'Rajouri',
                'Poonch', 'Doda', 'Ramban', 'Kishtwar',
                'Leh', 'Kargil',
            ])],
            'beneficiary_address' => 'required|string|max:500',
            'beneficiary_pincode' => 'required|string|size:6',
            'consumer_number' => ['nullable', 'string', 'max:100', new \App\Rules\GloballyUniqueConsumerNumber],
            'discom_name' => 'required|string|max:255',
            'roof_size' => 'nullable|in:less_100,100_200,200_300,300_plus',
            'system_capacity' => 'required|in:1kw,2kw,3kw,3.3kw,4kw,5kw,5.5kw,6kw,7kw,8kw,9kw,10kw,above_10kw,above_3kw',
            'monthly_bill_amount' => 'nullable|numeric|min:0',
            'category' => 'nullable|in:APL,BPL,AAY,OTHER',
            'query_message' => 'nullable|string',
            'aadhaar_front' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'aadhaar_back' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'electricity_bill' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'photo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'other' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'solar_roof_photo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'bank_passbook' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'consumer_signature' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'referral_agent_id' => 'nullable|string|max:20',
            // Bank Details (QW-2)
            'beneficiary_bank_account' => 'required|string|max:255',
            'beneficiary_bank_ifsc'    => 'required|string|max:20',
            'beneficiary_bank_branch'  => 'required|string|max:100',
            'beneficiary_bank_name'    => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'aadhaar_front.required' => 'Aadhaar front card upload is required.',
            'aadhaar_front.mimes' => 'Aadhaar front must be JPG, PNG or PDF.',
            'aadhaar_front.max' => 'Aadhaar front file must not exceed 5MB.',
            'aadhaar_back.required' => 'Aadhaar back card upload is required.',
            'aadhaar_back.mimes' => 'Aadhaar back must be JPG, PNG or PDF.',
            'aadhaar_back.max' => 'Aadhaar back file must not exceed 5MB.',
            'electricity_bill.required' => 'Electricity bill upload is required.',
            'electricity_bill.mimes' => 'Electricity bill must be JPG, PNG or PDF.',
            'electricity_bill.max' => 'Electricity bill must not exceed 5MB.',
            'beneficiary_state.in' => 'State must be Jammu & Kashmir or Ladakh.',
            'beneficiary_district.in' => 'Please select a valid district.',
            'beneficiary_mobile.regex' => 'Mobile number must start with 6, 7, 8, or 9.',
            'beneficiary_mobile.size' => 'Mobile number must be exactly 10 digits.',
        ];
    }

    public function attributes(): array
    {
        return [
            'other' => 'PAN Card',
        ];
    }
}
