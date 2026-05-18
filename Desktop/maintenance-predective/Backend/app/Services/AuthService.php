<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function attempt(string $email, string $password): ?User
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        return $user;
    }

    public function createToken(User $user): string
    {
        // Revoke all previous tokens for this user (single-session policy)
        $user->tokens()->delete();

        return $user->createToken('api-token', ['*'], now()->addDays(7))
                    ->plainTextToken;
    }

    public function revokeCurrentToken(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
