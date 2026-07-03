<?php

use App\Http\Controllers\Api\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned the "api" middleware group. Make something great!
|
*/

Route::prefix('auth')->group(function () {

    // Public routes
    Route::post('/register',       [AuthController::class, 'register']);
    Route::post('/login',          [AuthController::class, 'login']);
    Route::post('/forgot-password',[AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/me',               [AuthController::class, 'me']);
        Route::put('/profile',          [AuthController::class, 'updateProfile']);
        Route::put('/change-password',  [AuthController::class, 'changePassword']);
        Route::post('/avatar',          [AuthController::class, 'uploadAvatar']);
        Route::delete('/avatar',        [AuthController::class, 'deleteAvatar']);
    });

});
