<?php

namespace App\Console\Commands;

use App\Events\MotorUpdated;
use App\Events\SensorUpdated;
use App\Models\Motor;
use App\Models\Sensor;
use Illuminate\Console\Command;

class PollSensors extends Command
{
    protected $signature = 'sensors:poll
                            {--interval=2 : Polling interval in seconds (min 1)}';

    protected $description = 'Detect sensor changes from any source (phpMyAdmin, Tinker, scripts…) and broadcast via WebSocket';

    public function handle(): int
    {
        $interval = max(1, (int) $this->option('interval'));
        $this->info("Polling sensors every {$interval}s — Ctrl+C to stop.");

        $prev = $this->snapshot();
        $this->info('Snapshot: ' . count($prev) . ' sensor(s) loaded.');

        while (true) {
            sleep($interval);

            try {
                $curr = $this->snapshot();
            } catch (\Throwable $e) {
                $this->error('DB read failed: ' . $e->getMessage());
                continue;
            }

            // ── Changed or newly inserted sensors ─────────────────────────
            foreach ($curr as $id => $entry) {
                if (($prev[$id]['hash'] ?? null) !== $entry['hash']) {
                    try {
                        $sensor = Sensor::find($id);
                        if ($sensor) {
                            SensorUpdated::dispatch($sensor);
                            $label = isset($prev[$id]) ? 'CHANGED' : 'NEW';
                            $this->line("  <info>[{$label}]</info> sensor #{$id} ({$sensor->nom}) → SensorUpdated broadcast");
                        }
                    } catch (\Throwable $e) {
                        $this->error("  Broadcast failed for sensor #{$id}: {$e->getMessage()}");
                    }
                }
            }

            // ── Deleted sensors — broadcast MotorUpdated with current sensor list ──
            foreach (array_diff_key($prev, $curr) as $id => $entry) {
                try {
                    $motor = Motor::with('sensors')->find($entry['motor_id']);
                    if ($motor) {
                        MotorUpdated::dispatch($motor);
                        $this->line("  <comment>[DELETED]</comment> sensor #{$id} → MotorUpdated broadcast for motor #{$entry['motor_id']}");
                    }
                } catch (\Throwable $e) {
                    $this->error("  Broadcast failed after deletion of sensor #{$id}: {$e->getMessage()}");
                }
            }

            $prev = $curr;
        }

        return self::SUCCESS;
    }

    /**
     * Build a fingerprint map: [sensor_id => ['hash' => string, 'motor_id' => int]]
     * Hash covers every business field so any direct-DB edit is detected.
     */
    private function snapshot(): array
    {
        return Sensor::all()
            ->keyBy('id')
            ->map(fn (Sensor $s) => [
                'motor_id' => $s->motor_id,
                'hash'     => md5(implode("\x00", [
                    $s->motor_id,
                    $s->nom,
                    $s->type,
                    $s->unite,
                    (string) $s->valeur_actuelle,
                    (string) $s->seuil_min,
                    (string) $s->seuil_max,
                    $s->statut,
                    $s->emplacement,
                    $s->description,
                    $s->derniere_lecture_at,
                ])),
            ])
            ->toArray();
    }
}
