<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkCommissionPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'in:bank_transfer,upi,cash,cheque'],
            'payment_reference' => ['required', 'string', 'max:150'],
            'payment_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
