<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSuperAgentLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', 'in:NEW,ON_HOLD,REGISTERED,SITE_SURVEY,AT_BANK,PROJECT_COMMISSIONING,SUBSIDY_REQUEST,SUBSIDY_APPLIED,SUBSIDY_DISBURSED,COMPLETED'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'follow_up_date' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
