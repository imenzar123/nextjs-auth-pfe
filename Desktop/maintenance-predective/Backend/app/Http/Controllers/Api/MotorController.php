<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMotorRequest;
use App\Http\Requests\UpdateMotorRequest;
use App\Models\Motor;
use Illuminate\Http\JsonResponse;

class MotorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Motor::orderBy('id')->get());
    }

    public function show(Motor $motor): JsonResponse
    {
        return response()->json($motor);
    }

    public function store(StoreMotorRequest $request): JsonResponse
    {
        $motor = Motor::create($request->validated());

        return response()->json($motor, 201);
    }

    public function update(UpdateMotorRequest $request, Motor $motor): JsonResponse
    {
        $motor->update($request->validated());

        return response()->json($motor);
    }

    public function destroy(Motor $motor): JsonResponse
    {
        $motor->delete();

        return response()->json(['message' => 'Motor deleted successfully.']);
    }
}
