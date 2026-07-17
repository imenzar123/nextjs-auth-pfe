<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSensorHistoryRequest;
use App\Models\Sensor;
use App\Models\SensorHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorHistoryController extends Controller
{
    /**
     * GET /sensor-histories
     * Optional filters: ?sensor_id=, ?motor_id=, ?status=, ?from=, ?to=
     */
    public function index(Request $request): JsonResponse
    {
        $query = SensorHistory::orderBy('measured_at', 'desc');

        if ($request->filled('sensor_id')) {
            $query->where('sensor_id', $request->integer('sensor_id'));
        }

        if ($request->filled('motor_id')) {
            $query->where('motor_id', $request->integer('motor_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('from')) {
            $query->where('measured_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('measured_at', '<=', $request->input('to'));
        }

        return response()->json($query->get());
    }

    /**
     * GET /sensors/{sensor}/histories
     * All history records for a given sensor, most recent first.
     */
    public function indexBySensor(Sensor $sensor): JsonResponse
    {
        return response()->json(
            $sensor->sensorHistories()->orderBy('measured_at', 'desc')->get()
        );
    }

    /** GET /sensor-histories/{sensorHistory} */
    public function show(SensorHistory $sensorHistory): JsonResponse
    {
        return response()->json($sensorHistory);
    }

    /** POST /sensor-histories */
    public function store(StoreSensorHistoryRequest $request): JsonResponse
    {
        $history = SensorHistory::create($request->validated());

        return response()->json($history, 201);
    }

    /** DELETE /sensor-histories/{sensorHistory} */
    public function destroy(SensorHistory $sensorHistory): JsonResponse
    {
        $sensorHistory->delete();

        return response()->json(['message' => 'History record deleted successfully.']);
    }
}
