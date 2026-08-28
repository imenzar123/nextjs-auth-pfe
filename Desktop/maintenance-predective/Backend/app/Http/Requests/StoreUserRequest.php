<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role'           => ['required', 'string', 'in:admin,user,operator'],
            'statut'         => ['sometimes', 'string', 'in:actif,inactif'],
            'telephone'      => ['required', 'string', 'max:20'],
            'date_naissance' => ['required', 'date'],
            'genre'          => ['required', 'in:homme,femme'],
            'poste'          => ['required', 'string', 'max:100'],
            'departement'    => ['required', 'string', 'max:100'],
            'adresse'        => ['required', 'string'],
            'date_embauche'  => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'            => 'Name is required.',
            'email.required'           => 'Email is required.',
            'email.email'              => 'Email must be a valid email address.',
            'email.unique'             => 'An account with this email already exists.',
            'role.required'            => 'Role is required.',
            'role.in'                  => 'Role must be admin, user, or operator.',
            'statut.in'                => 'Statut must be actif or inactif.',
            'telephone.required'       => 'Telephone is required.',
            'date_naissance.required'  => 'Date de naissance is required.',
            'genre.required'           => 'Genre is required.',
            'genre.in'                 => 'Genre must be homme or femme.',
            'poste.required'           => 'Poste is required.',
            'departement.required'     => 'Departement is required.',
            'adresse.required'         => 'Adresse is required.',
            'date_embauche.required'   => 'Date embauche is required.',
        ];
    }
}
