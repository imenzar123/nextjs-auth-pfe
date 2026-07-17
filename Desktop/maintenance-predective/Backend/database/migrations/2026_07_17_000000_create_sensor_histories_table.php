<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensor_id')->constrained('sensors')->cascadeOnDelete();
            $table->foreignId('motor_id')->constrained('motors')->cascadeOnDelete();

            $table->decimal('measured_value', 10, 3);  // measured sensor value
            $table->string('unit', 20);                // mm/s | A | °C | RPM | bar
            $table->string('status', 20);              // normal | warning | critical

            $table->timestamp('measured_at');          // physical measurement time
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_histories');
    }
};
