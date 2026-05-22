<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'operator') NOT NULL DEFAULT 'user'");
        } elseif (DB::getDriverName() === 'sqlite') {
            // SQLite cannot ALTER a CHECK constraint — recreate table with expanded allowed values.
            DB::statement("CREATE TABLE users_new (
                id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name       VARCHAR NOT NULL,
                email      VARCHAR NOT NULL UNIQUE,
                email_verified_at DATETIME,
                password   VARCHAR NOT NULL,
                role       VARCHAR NOT NULL DEFAULT 'user'
                           CHECK (role IN ('admin','user','operator')),
                remember_token VARCHAR,
                created_at DATETIME,
                updated_at DATETIME
            )");
            DB::statement("INSERT INTO users_new SELECT id,name,email,email_verified_at,password,role,remember_token,created_at,updated_at FROM users");
            DB::statement("DROP TABLE users");
            DB::statement("ALTER TABLE users_new RENAME TO users");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("UPDATE users SET role = 'user' WHERE role = 'operator'");
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user'");
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::statement("UPDATE users SET role = 'user' WHERE role = 'operator'");
            DB::statement("CREATE TABLE users_new (
                id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name       VARCHAR NOT NULL,
                email      VARCHAR NOT NULL UNIQUE,
                email_verified_at DATETIME,
                password   VARCHAR NOT NULL,
                role       VARCHAR NOT NULL DEFAULT 'user'
                           CHECK (role IN ('admin','user')),
                remember_token VARCHAR,
                created_at DATETIME,
                updated_at DATETIME
            )");
            DB::statement("INSERT INTO users_new SELECT id,name,email,email_verified_at,password,role,remember_token,created_at,updated_at FROM users");
            DB::statement("DROP TABLE users");
            DB::statement("ALTER TABLE users_new RENAME TO users");
        }
    }
};
