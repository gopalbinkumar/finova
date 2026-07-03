<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'string', 'email', 'exists:users,email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required'         => 'Reset token is required.',
            'email.required'         => 'Email address is required.',
            'email.exists'           => 'No account found with this email address.',
            'password.required'      => 'New password is required.',
            'password.min'           => 'Password must be at least 8 characters.',
            'password.confirmed'     => 'Passwords do not match.',
        ];
    }
}
