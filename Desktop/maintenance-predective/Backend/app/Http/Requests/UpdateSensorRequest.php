<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSensorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motor_id'           => ['sometimes', 'required', 'integer', 'exists:motors,id'],
            'nom'                => ['sometimes', 'required', 'string', 'max:255'],
            'type'               => ['sometimes', 'required', 'string', 'in:vibration,courant,temperature,vitesse,pression'],
            'unite'              => ['sometimes', 'required', 'string', 'max:20'],
            'valeur_actuelle'    => ['nullable', 'numeric'],
            'seuil_min'          => ['nullable', 'numeric'],
            'seuil_max'          => ['nullable', 'numeric'],
            'statut'             => ['sometimes', 'required', 'string', 'in:actif,inactif,attention,alarme'],
            'emplacement'        => ['nullable', 'string', 'max:255'],
            'description'        => ['nullable', 'string', 'max:1000'],
            'derniere_lecture_at' => ['nullable', 'date'],
        ];
    }
}
