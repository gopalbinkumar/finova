<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user()->id),
            ],
            'phone'    => ['nullable', 'string', 'max:20'],
            'currency' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'theme'    => ['nullable', 'string', Rule::in(['light', 'dark', 'system'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.unique'   => 'This email address is already in use.',
            'theme.in'       => 'Theme must be light, dark, or system.',
        ];
    }
}
