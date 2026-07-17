<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', "unique:users,email,{$userId}"],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Le nom est obligatoire.',
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email'    => "L'adresse e-mail n'est pas valide.",
            'email.unique'   => 'Cette adresse e-mail est déjà utilisée par un autre compte.',
        ];
    }
}
