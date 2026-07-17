<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sensor_id',
    'motor_id',
    'measured_value',
    'unit',
    'status',
    'measured_at',
])]
class SensorHistory extends Model
{
    protected function casts(): array
    {
        return [
            'measured_value' => 'float',
            'measured_at'    => 'datetime',
        ];
    }

    public function sensor(): BelongsTo
    {
        return $this->belongsTo(Sensor::class);
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }
}
