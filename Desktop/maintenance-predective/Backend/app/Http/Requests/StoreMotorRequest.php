<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMotorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'               => ['required', 'string', 'max:255'],
            'modele'            => ['required', 'string', 'max:255'],
            'fabricant'         => ['required', 'string', 'max:255'],
            'emplacement'       => ['required', 'string', 'max:255'],
            'puissance'         => ['nullable', 'numeric', 'min:0'],
            'tension'           => ['nullable', 'numeric', 'min:0'],
            'courant'           => ['nullable', 'numeric', 'min:0'],
            'vitesse'           => ['nullable', 'numeric', 'min:0'],
            'cos_phi'           => ['nullable', 'numeric', 'min:0', 'max:1'],
            'date_installation' => ['nullable', 'date'],
        ];
    }
}
