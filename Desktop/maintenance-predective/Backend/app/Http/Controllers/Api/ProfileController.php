<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    private const MAX_AVATAR_KO = 2048; // 2 Mo

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json($this->format($request, $user));
    }

    /** POST /profile/avatar — upload/remplace l'avatar de l'utilisateur connecté, tous rôles */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:' . self::MAX_AVATAR_KO],
        ]);

        $user = $request->user();

        // Remplace l'ancien fichier plutôt que d'accumuler des avatars orphelins.
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars/' . $user->id, 'public');
        $user->update(['avatar' => $path]);

        return response()->json($this->format($request, $user));
    }

    /**
     * L'URL générée par Storage::url() embarque APP_URL, qui n'inclut pas le port en dev
     * (http://localhost au lieu de :8000) — on ne garde donc que le chemin et on préfixe
     * avec l'hôte réel de la requête entrante (même pattern que InterventionFichierController).
     */
    private function format(Request $request, $user): array
    {
        $avatarUrl = null;
        if ($user->avatar) {
            $path = parse_url(Storage::disk('public')->url($user->avatar), PHP_URL_PATH);
            $avatarUrl = $request->getSchemeAndHttpHost() . $path;
        }

        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'avatar'         => $avatarUrl,
            'telephone'      => $user->telephone,
            'date_naissance' => $user->date_naissance?->format('Y-m-d'),
            'genre'          => $user->genre,
            'poste'          => $user->poste,
            'departement'    => $user->departement,
            'adresse'        => $user->adresse,
            'date_embauche'  => $user->date_embauche?->format('Y-m-d'),
        ];
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors'  => ['current_password' => ['Le mot de passe actuel est incorrect.']],
            ], 422);
        }

        // The 'hashed' cast on the User model hashes the value automatically.
        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}
