<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Mail\WelcomeUserMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    private function format(User $user): array
    {
        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ];
    }

    public function index(): JsonResponse
    {
        $users = User::orderBy('name')->get()->map(fn(User $u) => $this->format($u));

        return response()->json($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        // Generate a secure random password (letters + numbers, no symbols).
        $plainPassword = Str::password(length: 10, symbols: false);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $plainPassword, // hashed automatically by the model cast
            'role'     => $request->role,
        ]);

        // Send credentials email (best-effort — user is created regardless).
        try {
            Mail::to($user->email)->send(new WelcomeUserMail($user, $plainPassword));
        } catch (\Throwable $e) {
            \Log::warning("Welcome email failed for user #{$user->id}: {$e->getMessage()}");
        }

        return response()->json($this->format($user), 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->only('name', 'email', 'role'));

        return response()->json($this->format($user));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        // Prevent an admin from deleting their own account.
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
