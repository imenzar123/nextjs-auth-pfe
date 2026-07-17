<?php

namespace App\Observers;

use App\Events\SensorUpdated;
use App\Models\Sensor;

class SensorObserver
{
    public function created(Sensor $sensor): void
    {
        $this->broadcast($sensor);
    }

    public function updated(Sensor $sensor): void
    {
        $this->broadcast($sensor);
    }

    public function deleted(Sensor $sensor): void
    {
        $this->broadcast($sensor);
    }

    private function broadcast(Sensor $sensor): void
    {
        try {
            SensorUpdated::dispatch($sensor);
        } catch (\Throwable) {
            // Reverb unavailable — CRUD succeeds, real-time update skipped.
        }
    }
}
