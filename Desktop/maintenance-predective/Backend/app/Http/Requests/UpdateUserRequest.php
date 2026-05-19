<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Route model binding gives us the User instance directly.
        $userId = $this->route('user')?->id;

        return [
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', "unique:users,email,{$userId}"],
            'role'  => ['sometimes', 'string', 'in:admin,user'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'   => 'Email must be a valid email address.',
            'email.unique'  => 'An account with this email already exists.',
            'role.in'       => 'Role must be admin or user.',
        ];
    }
}
