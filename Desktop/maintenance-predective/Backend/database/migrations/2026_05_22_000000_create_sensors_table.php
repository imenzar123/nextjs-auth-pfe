<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motor_id')->constrained('motors')->cascadeOnDelete();

            $table->string('nom');                    // e.g. "Capteur Vibration X"
            $table->string('type');                   // vibration | courant | temperature | vitesse | pression
            $table->string('unite');                  // mm/s | A | °C | RPM | bar

            $table->decimal('valeur_actuelle', 10, 3)->nullable();  // last measured value
            $table->decimal('seuil_min',       10, 3)->nullable();  // lower alarm threshold
            $table->decimal('seuil_max',       10, 3)->nullable();  // upper alarm threshold

            // actif | inactif | attention | alarme
            $table->string('statut')->default('actif');

            $table->string('emplacement')->nullable(); // e.g. "Palier avant", "Axe principal"
            $table->text('description')->nullable();

            $table->timestamp('derniere_lecture_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};
