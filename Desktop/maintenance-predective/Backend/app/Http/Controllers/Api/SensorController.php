<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSensorRequest;
use App\Http\Requests\UpdateSensorRequest;
use App\Models\Motor;
use App\Models\Sensor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    /** GET /sensors?motor_id=X  — all sensors, optionally filtered by motor */
    public function index(Request $request): JsonResponse
    {
        $query = Sensor::with('motor:id,nom')->orderBy('motor_id')->orderBy('id');

        if ($request->filled('motor_id')) {
            $query->where('motor_id', $request->integer('motor_id'));
        }

        return response()->json($query->get());
    }

    /** GET /motors/{motor}/sensors  — sensors nested under a motor */
    public function indexByMotor(Motor $motor): JsonResponse
    {
        return response()->json(
            $motor->sensors()->orderBy('id')->get()
        );
    }

    /** GET /sensors/{sensor} */
    public function show(Sensor $sensor): JsonResponse
    {
        return response()->json($sensor->load('motor:id,nom'));
    }

    /** POST /sensors */
    public function store(StoreSensorRequest $request): JsonResponse
    {
        $sensor = Sensor::create($request->validated());

        return response()->json($sensor->load('motor:id,nom'), 201);
    }

    /** PUT /sensors/{sensor} */
    public function update(UpdateSensorRequest $request, Sensor $sensor): JsonResponse
    {
        $sensor->update($request->validated());

        return response()->json($sensor->load('motor:id,nom'));
    }

    /** DELETE /sensors/{sensor} */
    public function destroy(Sensor $sensor): JsonResponse
    {
        $sensor->delete();

        return response()->json(['message' => 'Sensor deleted successfully.']);
    }
}
