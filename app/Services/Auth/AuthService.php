<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(Request $request, array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => Str::lower($data['email']),
            'password' => $data['password'],
            'currency' => 'USD',
            'timezone' => 'UTC',
            'theme' => 'system',
        ]);

        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        return $user;
    }

    public function login(Request $request, array $data): User
    {
        $remember = (bool) ($data['remember'] ?? false);

        $credentials = [
            'email' => Str::lower($data['email']),
            'password' => $data['password'],
        ];

        if (! Auth::guard('web')->attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak sesuai.'],
            ]);
        }

        $request->session()->regenerate();

        return Auth::guard('web')->user();
    }

    public function logout(Request $request): void
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();
    }
}
