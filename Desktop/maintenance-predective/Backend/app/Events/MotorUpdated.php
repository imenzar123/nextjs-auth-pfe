<?php

namespace App\Events;

use App\Models\Motor;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MotorUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Motor $motor) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('motors-dashboard')];
    }

    public function broadcastAs(): string
    {
        return 'MotorUpdated';
    }

    public function broadcastWith(): array
    {
        $this->motor->loadMissing('sensors');
        $sensors = $this->motor->sensors;

        $status = 'normal';
        foreach ($sensors as $sensor) {
            if ($sensor->valeur_actuelle === null) {
                continue;
            }
            if (
                ($sensor->seuil_max !== null && $sensor->valeur_actuelle > $sensor->seuil_max) ||
                ($sensor->seuil_min !== null && $sensor->valeur_actuelle < $sensor->seuil_min)
            ) {
                $status = 'critical';
                break;
            }
            if ($status !== 'warning' && $sensor->seuil_max !== null && $sensor->seuil_min !== null) {
                $range = $sensor->seuil_max - $sensor->seuil_min;
                if ($range > 0) {
                    $margin = $range * 0.15;
                    if (
                        $sensor->valeur_actuelle > ($sensor->seuil_max - $margin) ||
                        $sensor->valeur_actuelle < ($sensor->seuil_min + $margin)
                    ) {
                        $status = 'warning';
                    }
                }
            }
        }

        return [
            'motor' => [
                'id'                => $this->motor->id,
                'nom'               => $this->motor->nom,
                'modele'            => $this->motor->modele,
                'fabricant'         => $this->motor->fabricant,
                'emplacement'       => $this->motor->emplacement,
                'puissance'         => $this->motor->puissance,
                'tension'           => $this->motor->tension,
                'courant'           => $this->motor->courant,
                'vitesse'           => $this->motor->vitesse,
                'cos_phi'           => $this->motor->cos_phi,
                'date_installation' => $this->motor->date_installation?->format('Y-m-d'),
            ],
            'sensors' => $sensors->map(fn ($s) => [
                'id'                 => $s->id,
                'nom'                => $s->nom,
                'type'               => $s->type,
                'unite'              => $s->unite,
                'valeur_actuelle'    => $s->valeur_actuelle,
                'seuil_min'          => $s->seuil_min,
                'seuil_max'          => $s->seuil_max,
                'statut'             => $s->statut,
                'derniere_lecture_at' => $s->derniere_lecture_at?->toIso8601String(),
            ])->values()->toArray(),
            'status'    => $status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
