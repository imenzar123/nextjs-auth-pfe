<?php

namespace App\Events;

use App\Models\Sensor;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SensorUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Sensor $sensor) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('motors-dashboard')];
    }

    public function broadcastAs(): string
    {
        return 'SensorUpdated';
    }

    public function broadcastWith(): array
    {
        $this->sensor->loadMissing('motor');

        $status = 'normal';
        $v   = $this->sensor->valeur_actuelle;
        $min = $this->sensor->seuil_min;
        $max = $this->sensor->seuil_max;

        if ($v !== null && $max !== null && $min !== null) {
            if ($v > $max || $v < $min) {
                $status = 'critical';
            } else {
                $range = $max - $min;
                if ($range > 0) {
                    $margin = $range * 0.15;
                    if ($v > ($max - $margin) || $v < ($min + $margin)) {
                        $status = 'warning';
                    }
                }
            }
        }

        return [
            'sensor' => [
                'id'                 => $this->sensor->id,
                'motor_id'           => $this->sensor->motor_id,
                'nom'                => $this->sensor->nom,
                'type'               => $this->sensor->type,
                'unite'              => $this->sensor->unite,
                'valeur_actuelle'    => $this->sensor->valeur_actuelle,
                'seuil_min'          => $this->sensor->seuil_min,
                'seuil_max'          => $this->sensor->seuil_max,
                'statut'             => $this->sensor->statut,
                'emplacement'        => $this->sensor->emplacement,
                'description'        => $this->sensor->description,
                'derniere_lecture_at' => $this->sensor->derniere_lecture_at?->toIso8601String(),
            ],
            'motor' => $this->sensor->motor ? [
                'id'  => $this->sensor->motor->id,
                'nom' => $this->sensor->motor->nom,
            ] : null,
            'status'    => $status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
