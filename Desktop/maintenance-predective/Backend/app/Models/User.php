<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 'email', 'password', 'role', 'statut',
    'telephone', 'date_naissance', 'genre', 'poste',
    'departement', 'adresse', 'date_embauche', 'avatar',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'date_naissance'    => 'date:Y-m-d',
            'date_embauche'     => 'date:Y-m-d',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    public function isElevated(): bool
    {
        return $this->role === 'admin' || $this->role === 'operator';
    }

    public function isInactif(): bool
    {
        return $this->statut === 'inactif';
    }

    public function tachesAssignees(): HasMany
    {
        return $this->hasMany(Tache::class, 'assigne_a');
    }

    public function tachesCreees(): HasMany
    {
        return $this->hasMany(Tache::class, 'assigne_par');
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }

    public function pageVisits(): HasMany
    {
        return $this->hasMany(PageVisit::class);
    }
}
