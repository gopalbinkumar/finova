<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AuthService
{
    /**
     * Register a new user and return token.
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('finova-auth-token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate user and return token.
     *
     * @throws ValidationException
     */
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke old tokens to prevent token accumulation (optional: keep per device)
        $user->tokens()->where('name', 'finova-auth-token')->delete();

        $token = $user->createToken('finova-auth-token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Revoke the current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Send a password reset link to the user's email.
     *
     * @throws ValidationException
     */
    public function forgotPassword(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    /**
     * Reset the user's password.
     *
     * @throws ValidationException
     */
    public function resetPassword(array $data): void
    {
        $status = Password::reset(
            [
                'email'                 => $data['email'],
                'password'              => $data['password'],
                'password_confirmation' => $data['password_confirmation'],
                'token'                 => $data['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // Revoke all tokens except the current one so other devices are logged out
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
    }

    /**
     * Update user profile information.
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'phone'    => $data['phone']    ?? $user->phone,
            'currency' => $data['currency'] ?? $user->currency,
            'timezone' => $data['timezone'] ?? $user->timezone,
            'theme'    => $data['theme']    ?? $user->theme,
        ]);

        return $user->fresh();
    }

    /**
     * Upload and store avatar image.
     */
    public function uploadAvatar(User $user, UploadedFile $file): User
    {
        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $file->store('avatars', 'public');

        $user->update(['avatar' => $path]);

        return $user->fresh();
    }

    /**
     * Delete the user's avatar.
     */
    public function deleteAvatar(User $user): User
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return $user->fresh();
    }
}
