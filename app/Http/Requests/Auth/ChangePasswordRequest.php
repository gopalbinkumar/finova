<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password'      => ['required', 'string', 'current_password'],
            'password'              => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
            'password_confirmation' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required'      => 'Current password is required.',
            'current_password.current_password' => 'The current password is incorrect.',
            'password.required'              => 'New password is required.',
            'password.min'                   => 'New password must be at least 8 characters.',
            'password.confirmed'             => 'New passwords do not match.',
            'password.different'             => 'New password must be different from current password.',
        ];
    }
}
