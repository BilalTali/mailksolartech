<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnterAgentCommissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999.99'],
        ];
    }
}
