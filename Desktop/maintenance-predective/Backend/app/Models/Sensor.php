<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'motor_id',
    'nom',
    'type',
    'unite',
    'valeur_actuelle',
    'seuil_min',
    'seuil_max',
    'statut',
    'emplacement',
    'description',
    'derniere_lecture_at',
])]
class Sensor extends Model
{
    protected function casts(): array
    {
        return [
            'valeur_actuelle'    => 'float',
            'seuil_min'          => 'float',
            'seuil_max'          => 'float',
            'derniere_lecture_at' => 'datetime',
        ];
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }
}
