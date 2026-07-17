<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nom', 'modele', 'fabricant', 'emplacement', 'puissance', 'tension', 'courant', 'vitesse', 'cos_phi', 'date_installation'])]
class Motor extends Model
{
    protected function casts(): array
    {
        return [
            'puissance'         => 'float',
            'tension'           => 'float',
            'courant'           => 'float',
            'vitesse'           => 'float',
            'cos_phi'           => 'float',
            'date_installation' => 'date:Y-m-d',
        ];
    }

    public function sensors(): HasMany
    {
        return $this->hasMany(Sensor::class);
    }

    public function sensorHistories(): HasMany
    {
        return $this->hasMany(SensorHistory::class);
    }
}
