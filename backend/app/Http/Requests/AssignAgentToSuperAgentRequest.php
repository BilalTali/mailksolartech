<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignAgentToSuperAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agent_id' => ['required', 'integer', 'exists:users,id'],
            'agent_ids' => ['sometimes', 'array', 'min:1'],
            'agent_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
