<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name'     => 'Admin',
            'email'    => 'admin@maintenance.com',
            'password' => 'admin1234',
            'role'     => 'admin',
        ]);

        User::factory()->create([
            'name'     => 'Utilisateur',
            'email'    => 'user@maintenance.com',
            'password' => 'user1234',
            'role'     => 'user',
        ]);

        User::factory()->create([
            'name'     => 'Operateur',
            'email'    => 'operator@maintenance.com',
            'password' => 'operator1234',
            'role'     => 'operator',
        ]);
    }
}
