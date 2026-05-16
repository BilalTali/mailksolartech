<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnumeratorRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'mobile' => ['required', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/', new \App\Rules\GloballyUniqueMobile],

            'email' => 'nullable|email|unique:users,email',
            'state' => ['required', 'string', Rule::in(['Jammu & Kashmir', 'Ladakh'])],
            'district' => ['required', 'string', Rule::in([
                'Srinagar', 'Baramulla', 'Anantnag', 'Pulwama', 'Kupwara', 'Budgam',
                'Bandipora', 'Bandipore', 'Ganderbal', 'Kulgam', 'Shopian',
                'Jammu', 'Kathua', 'Udhampur', 'Reasi', 'Samba', 'Rajouri',
                'Poonch', 'Doda', 'Ramban', 'Kishtwar',
                'Leh', 'Kargil',
            ])],
            'area' => 'required|string|max:255',
            'aadhaar_number' => 'required|string|size:12|regex:/^\d{12}$/',
            'occupation' => 'required|string|max:255',

            // Additional Profile Fields
            'father_name' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'blood_group' => 'nullable|string|max:10',
            'religion' => 'nullable|string|max:100',
            'gender' => 'nullable|string|in:male,female,other',
            'marital_status' => 'nullable|string|in:single,married,divorced,widowed',
            'permanent_address' => 'nullable|string',
            'current_address' => 'nullable|string',
            'pincode' => 'nullable|string|max:10',
            'landmark' => 'nullable|string|max:255',
            'pan_number' => 'nullable|string|size:10|regex:/^[A-Z]{5}\d{4}[A-Z]$/i',
            'voter_id' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|regex:/^\d{9,18}$/',
            'bank_ifsc' => 'nullable|string|size:11|regex:/^[A-Z]{4}0[A-Z0-9]{6}$/i',
            'bank_branch' => 'nullable|string|max:255',
            'upi_id' => 'nullable|string|max:100',
            'experience_years' => 'nullable|integer|min:0',
            'languages_known' => 'nullable|array',
            'reference_name' => 'nullable|string|max:255',
            'reference_mobile' => 'nullable|string|max:20',

            // Document uploads (Section 6 — registration docs)
            'profile_photo' => 'required|image|mimes:jpg,jpeg,png|max:1024',
            'aadhaar_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'pan_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'police_verification' => 'nullable|string|max:255',
            'education_level' => 'nullable|in:8th,10th,12th,graduate,post_graduate,other',
            'education_cert' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'mou_signed' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'mobile.unique' => 'This mobile number is already registered.',
            'mobile.regex' => 'Invalid mobile number format.',
            'aadhaar_number.regex' => 'Aadhaar must be exactly 12 digits.',
            'state.in' => 'State must be Jammu & Kashmir or Ladakh.',
            'district.in' => 'Please select a valid district.',
            'profile_photo.required' => 'Profile photo is required for registration.',
            'aadhaar_document.required' => 'Aadhaar card scan is required for registration.',
        ];
    }
}
