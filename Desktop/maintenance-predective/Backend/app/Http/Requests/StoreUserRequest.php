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
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role'  => ['required', 'string', 'in:admin,user,operator'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.email'    => 'Email must be a valid email address.',
            'email.unique'   => 'An account with this email already exists.',
            'role.required'  => 'Role is required.',
            'role.in'        => 'Role must be admin, user, or operator.',
        ];
    }
}
