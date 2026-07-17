<?php

namespace App\Providers;

use App\Models\Motor;
use App\Models\Sensor;
use App\Observers\MotorObserver;
use App\Observers\SensorObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Point password-reset emails at the Next.js frontend instead of Laravel.
        ResetPassword::createUrlUsing(function (object $user, string $token): string {
            return rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/')
                . '/reset-password'
                . '?token=' . $token
                . '&email=' . urlencode($user->email);
        });

        Motor::observe(MotorObserver::class);
        Sensor::observe(SensorObserver::class);
    }
}
