<?php

namespace App\Observers;

use App\Events\MotorUpdated;
use App\Models\Motor;

class MotorObserver
{
    public function created(Motor $motor): void
    {
        $this->broadcast($motor);
    }

    public function updated(Motor $motor): void
    {
        $this->broadcast($motor);
    }

    public function deleted(Motor $motor): void
    {
        $this->broadcast($motor);
    }

    private function broadcast(Motor $motor): void
    {
        try {
            MotorUpdated::dispatch($motor);
        } catch (\Throwable) {
            // Reverb unavailable — CRUD succeeds, real-time update skipped.
        }
    }
}
