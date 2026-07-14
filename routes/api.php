<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\InvestmentController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\DashboardController;


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
        Route::delete('/avatar', [AuthController::class, 'deleteAvatar']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard', DashboardController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('accounts', AccountController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::apiResource('budgets', BudgetController::class);
    Route::apiResource('goals', GoalController::class);
    Route::put('goals/{goal}/allocations', [GoalController::class, 'updateAllocations']);
    Route::get('investments/pnl', [InvestmentController::class, 'pnl']);
    Route::apiResource('investments', InvestmentController::class);
    Route::post('investments/{investment}/buy', [InvestmentController::class, 'buy']);
    Route::post('investments/{investment}/sell', [InvestmentController::class, 'sell']);
    Route::apiResource('debts', DebtController::class);
});
