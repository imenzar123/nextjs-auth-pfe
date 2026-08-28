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
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'statut'         => $user->statut,
            'telephone'      => $user->telephone,
            'date_naissance' => $user->date_naissance?->format('Y-m-d'),
            'genre'          => $user->genre,
            'poste'          => $user->poste,
            'departement'    => $user->departement,
            'adresse'        => $user->adresse,
            'date_embauche'  => $user->date_embauche?->format('Y-m-d'),
        ];
    }

    public function index(): JsonResponse
    {
        $users = User::orderBy('name')->get()->map(fn(User $u) => $this->format($u));

        return response()->json($users);
    }

    /** GET /users/techniciens — utilisateurs role 'user', pour le formulaire d'assignation d'alerte, réservé au rôle operator */
    public function techniciens(Request $request): JsonResponse
    {
        if (!in_array($request->user()?->role, ['operator', 'admin'])) {
            return response()->json(['message' => 'Forbidden. Operator access required.'], 403);
        }

        $techniciens = User::where('role', 'user')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($techniciens);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        // Generate a secure random password (letters + numbers, no symbols).
        $plainPassword = Str::password(length: 10, symbols: false);

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => $plainPassword, // hashed automatically by the model cast
            'role'           => $request->role,
            'statut'         => $request->statut ?? 'actif',
            'telephone'      => $request->telephone,
            'date_naissance' => $request->date_naissance,
            'genre'          => $request->genre,
            'poste'          => $request->poste,
            'departement'    => $request->departement,
            'adresse'        => $request->adresse,
            'date_embauche'  => $request->date_embauche,
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
        $user->update($request->only(
            'name', 'email', 'role', 'statut',
            'telephone', 'date_naissance', 'genre', 'poste',
            'departement', 'adresse', 'date_embauche',
        ));

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
