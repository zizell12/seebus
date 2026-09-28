<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_template', function (Blueprint $table) {
            $table->id('schedule_template_id');
            $table->unsignedBigInteger('route_id');
            $table->unsignedBigInteger('bus_unit_id'); // armada fisik spesifik
            $table->time('departure_time');
            $table->json('days_of_week'); // contoh: [1,3,5] = Senin, Rabu, Jumat
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('route_id')->references('route_id')->on('route')->onUpdate('cascade');
            $table->foreign('bus_unit_id')->references('bus_unit_id')->on('bus_unit')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_template');
    }
};
