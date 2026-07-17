<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\MotorController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SensorController;
use App\Http\Controllers\Api\SensorHistoryController;
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

    // Profile — authenticated user manages their own account
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    // Motors — read access for all authenticated users
    Route::get('/motors',          [MotorController::class, 'index']);
    Route::get('/motors/{motor}',  [MotorController::class, 'show']);

    // Sensors — read access for all authenticated users
    Route::get('/sensors',                      [SensorController::class, 'index']);
    Route::get('/sensors/{sensor}',             [SensorController::class, 'show']);
    Route::get('/motors/{motor}/sensors',       [SensorController::class, 'indexByMotor']);

    // Sensor histories — read access for all authenticated users
    Route::get('/sensor-histories',                    [SensorHistoryController::class, 'index']);
    Route::get('/sensor-histories/{sensorHistory}',    [SensorHistoryController::class, 'show']);
    Route::get('/sensors/{sensor}/histories',          [SensorHistoryController::class, 'indexBySensor']);

    /*
    |----------------------------------------------------------------------
    | Elevated — admin or operator (motors + sensors write access)
    |----------------------------------------------------------------------
    */
    Route::middleware('role.elevated')->group(function () {
        Route::post('/motors',           [MotorController::class, 'store']);
        Route::put('/motors/{motor}',    [MotorController::class, 'update']);
        Route::delete('/motors/{motor}', [MotorController::class, 'destroy']);

        Route::post('/sensors',           [SensorController::class, 'store']);
        Route::put('/sensors/{sensor}',   [SensorController::class, 'update']);
        Route::delete('/sensors/{sensor}',[SensorController::class, 'destroy']);

        Route::post('/sensor-histories',                   [SensorHistoryController::class, 'store']);
        Route::delete('/sensor-histories/{sensorHistory}', [SensorHistoryController::class, 'destroy']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin-only — user management
    |----------------------------------------------------------------------
    */
    Route::middleware('role.admin')->group(function () {
        Route::get('/users',           [UserController::class, 'index']);
        Route::post('/users',          [UserController::class, 'store']);
        Route::put('/users/{user}',    [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
