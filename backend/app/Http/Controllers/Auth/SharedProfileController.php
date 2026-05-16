<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SharedProfileController extends Controller
{
    /** Change password for the authenticated user */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    /** Set initial password (for accounts created without one) */
    public function setInitialPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // This is only for users who haven't set a password yet or are in "pending" password state
        // If they already have a password, they should use changePassword
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password set successfully.',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        // Pre-process empty strings to null for nullable fields to avoid validation errors
        // (especially for strict rules like 'size:12')
        $data = $request->all();
        foreach (['aadhaar_number', 'pan_number', 'bank_account_number', 'voter_id', 'email'] as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        $validated = \Illuminate\Support\Facades\Validator::make($data, [
            'email' => ['sometimes', 'nullable', 'email', 'unique:users,email,'.$user->id],
            'whatsapp_number' => ['nullable', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'dob' => ['nullable', 'date'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'religion' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'marital_status' => ['nullable', 'string', 'in:single,married,divorced,widowed'],
            'permanent_address' => ['nullable', 'string'],
            'current_address' => ['nullable', 'string'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:255'],
            'voter_id' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_ifsc' => ['nullable', 'string', 'size:11', 'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/i'],
            'bank_branch' => ['nullable', 'string', 'max:255'],
            'upi_id' => ['nullable', 'string', 'max:100'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'integer', 'min:0'],
            'languages_known' => ['nullable', 'array'],
            'reference_name' => ['nullable', 'string', 'max:255'],
            'reference_mobile' => ['nullable', 'string', 'max:20'],
            'territory' => ['nullable', 'string', 'max:255'],
            'pan_number' => ['nullable', 'string', 'size:10', 'regex:/^[A-Z]{5}\d{4}[A-Z]$/i'],
            'aadhaar_number' => ['nullable', 'string', 'size:12', 'regex:/^\d{12}$/'],
            'bank_account_number' => ['nullable', 'string', 'regex:/^\d{9,18}$/'],
            // Special cases for admins
            'name' => ['sometimes', 'string', 'max:255'],
        ])->validate();

        // Remove empty strings for sensitive fields to avoid overwriting with null
        // since these fields are hidden in the frontend and would be sent as empty strings
        if (isset($validated['aadhaar_number']) && empty($validated['aadhaar_number'])) {
            unset($validated['aadhaar_number']);
        }
        if (isset($validated['bank_account_number']) && empty($validated['bank_account_number'])) {
            unset($validated['bank_account_number']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user->fresh(),
            'message' => 'Profile updated successfully.',
        ]);
    }
}
