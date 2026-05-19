<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public — no token required
|--------------------------------------------------------------------------
*/
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/register',        [AuthController::class, 'register']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Authenticated — any valid token (admin OR user)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth utilities
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Future: motors, alerts, monitoring, prediction
    // Route::apiResource('motors',  MotorController::class);
    // Route::apiResource('alerts',  AlertController::class);
    // Route::get('temps-reel',      [MonitoringController::class, 'live']);
    // Route::get('prediction',      [PredictionController::class, 'index']);

    /*
    |----------------------------------------------------------------------
    | Admin-only — token required + role must be admin
    |----------------------------------------------------------------------
    */
    Route::middleware('role.admin')->group(function () {

        // User CRUD — admin only
        Route::get('/users',          [UserController::class, 'index']);
        Route::post('/users',         [UserController::class, 'store']);
        Route::put('/users/{user}',   [UserController::class, 'update']);
        Route::delete('/users/{user}',[UserController::class, 'destroy']);

    });
});
