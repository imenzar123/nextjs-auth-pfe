<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\LoginLog;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->authService->attempt(
            $request->email,
            $request->password
        );

        if (! $user) {
            // Read-only lookup, purely for the log message — never influences the auth decision above.
            $emailExists = User::where('email', $request->email)->exists();
            $this->logLoginAttempt(
                userId: null,
                email: $request->email,
                request: $request,
                resultat: 'echec',
                message: $emailExists ? 'Mot de passe incorrect' : 'Email non trouvé',
            );

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->isInactif()) {
            $this->logLoginAttempt(
                userId: $user->id,
                email: $user->email,
                request: $request,
                resultat: 'echec',
                message: 'Compte désactivé',
            );

            return response()->json([
                'message' => 'Votre compte est désactivé',
            ], 403);
        }

        $token = $this->authService->createToken($user);

        $this->logLoginAttempt(
            userId: $user->id,
            email: $user->email,
            request: $request,
            resultat: 'succes',
            message: 'Connexion réussie',
        );

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /** Non-bloquant : un échec d'écriture du log ne doit jamais empêcher la connexion. */
    private function logLoginAttempt(?int $userId, string $email, Request $request, string $resultat, string $message): void
    {
        try {
            LoginLog::create([
                'user_id'    => $userId,
                'email'      => $email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'resultat'   => $resultat,
                'message'    => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error('LoginLog::create failed', ['error' => $e->getMessage()]);
        }
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Même construction d'URL que ProfileController::format() — APP_URL n'inclut pas
        // le port en dev, on préfixe donc avec l'hôte réel de la requête entrante.
        $avatarUrl = null;
        if ($user->avatar) {
            $path = parse_url(Storage::disk('public')->url($user->avatar), PHP_URL_PATH);
            $avatarUrl = $request->getSchemeAndHttpHost() . $path;
        }

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'avatar'         => $avatarUrl,
            'telephone'      => $user->telephone,
            'date_naissance' => $user->date_naissance,
            'genre'          => $user->genre,
            'poste'          => $user->poste,
            'departement'    => $user->departement,
            'adresse'        => $user->adresse,
            'date_embauche'  => $user->date_embauche,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->authService->revokeCurrentToken($user);

        $this->logLoginAttempt(
            userId: $user->id,
            email: $user->email,
            request: $request,
            resultat: 'succes',
            message: 'Déconnexion',
        );

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        // sendResetLink returns a status string whether or not the email exists.
        // We intentionally return the same message in both cases to prevent
        // user enumeration — an attacker cannot tell if the email is registered.
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If this email is registered, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->save();

                // Invalidate every active session so stolen tokens cannot be reused.
                $this->authService->revokeAllTokens($user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user  = $this->authService->createUser(
            $request->name,
            $request->email,
            $request->password,
        );

        $token = $this->authService->createToken($user);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], 201);
    }
}
