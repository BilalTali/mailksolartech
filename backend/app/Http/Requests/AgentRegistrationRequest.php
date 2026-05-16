<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AgentRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/', 'unique:users,mobile'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'district' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:255'],
        ];
    }
}
