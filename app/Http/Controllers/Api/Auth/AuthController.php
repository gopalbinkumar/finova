<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AvatarUploadRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully. Welcome to Finova!',
            'data'    => [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 201);
    }

    /**
     * Authenticate user and return token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Login successful. Welcome back!',
            'data'    => [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ]);
    }

    /**
     * Logout the authenticated user (revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
            'data'    => null,
        ]);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'User profile retrieved.',
            'data'    => new UserResource($request->user()),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword($request->user(), $request->validated()['password']);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'data'    => null,
        ]);
    }

    /**
     * Upload user avatar.
     */
    public function uploadAvatar(AvatarUploadRequest $request): JsonResponse
    {
        $user = $this->authService->uploadAvatar($request->user(), $request->file('avatar'));

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Delete user avatar.
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $this->authService->deleteAvatar($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Avatar removed successfully.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Send a password reset link.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->forgotPassword($request->validated()['email']);

        return response()->json([
            'success' => true,
            'message' => 'Password reset link has been sent to your email.',
            'data'    => null,
        ]);
    }

    /**
     * Reset the user's password.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully. Please log in.',
            'data'    => null,
        ]);
    }
}
