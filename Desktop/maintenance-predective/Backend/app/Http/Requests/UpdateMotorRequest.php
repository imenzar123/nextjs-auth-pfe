<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMotorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'               => ['sometimes', 'required', 'string', 'max:255'],
            'modele'            => ['sometimes', 'required', 'string', 'max:255'],
            'fabricant'         => ['sometimes', 'required', 'string', 'max:255'],
            'emplacement'       => ['sometimes', 'required', 'string', 'max:255'],
            'puissance'         => ['nullable', 'numeric', 'min:0'],
            'tension'           => ['nullable', 'numeric', 'min:0'],
            'courant'           => ['nullable', 'numeric', 'min:0'],
            'vitesse'           => ['nullable', 'numeric', 'min:0'],
            'cos_phi'           => ['nullable', 'numeric', 'min:0', 'max:1'],
            'date_installation' => ['nullable', 'date'],
        ];
    }
}
