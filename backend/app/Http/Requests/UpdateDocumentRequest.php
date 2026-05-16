<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'        => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string|max:100',
            'is_published' => 'sometimes|boolean',
            'sort_order'   => 'sometimes|integer',
            'file'         => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:51200',
            'thumbnail'    => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ];
    }
}
