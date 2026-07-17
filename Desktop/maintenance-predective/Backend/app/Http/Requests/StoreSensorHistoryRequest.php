<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSensorHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sensor_id'      => ['required', 'integer', 'exists:sensors,id'],
            'motor_id'       => ['required', 'integer', 'exists:motors,id'],
            'measured_value' => ['required', 'numeric'],
            'unit'           => ['required', 'string', 'max:20'],
            'status'         => ['required', 'string', 'in:normal,warning,critical'],
            'measured_at'    => ['required', 'date'],
        ];
    }
}
