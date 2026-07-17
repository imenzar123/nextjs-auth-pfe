<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motors', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('modele');
            $table->string('fabricant');
            $table->string('emplacement');
            $table->decimal('puissance', 8, 2)->nullable();  // kW
            $table->decimal('tension',   8, 2)->nullable();  // V
            $table->decimal('courant',   8, 2)->nullable();  // A
            $table->decimal('vitesse',   8, 2)->nullable();  // RPM
            $table->decimal('cos_phi',   4, 3)->nullable();  // 0.000–1.000
            $table->date('date_installation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motors');
    }
};
