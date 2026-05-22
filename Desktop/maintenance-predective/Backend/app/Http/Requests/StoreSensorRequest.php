<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSensorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motor_id'           => ['required', 'integer', 'exists:motors,id'],
            'nom'                => ['required', 'string', 'max:255'],
            'type'               => ['required', 'string', 'in:vibration,courant,temperature,vitesse,pression'],
            'unite'              => ['required', 'string', 'max:20'],
            'valeur_actuelle'    => ['nullable', 'numeric'],
            'seuil_min'          => ['nullable', 'numeric'],
            'seuil_max'          => ['nullable', 'numeric'],
            'statut'             => ['required', 'string', 'in:actif,inactif,attention,alarme'],
            'emplacement'        => ['nullable', 'string', 'max:255'],
            'description'        => ['nullable', 'string', 'max:1000'],
            'derniere_lecture_at' => ['nullable', 'date'],
        ];
    }
}
