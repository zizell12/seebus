<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route', function (Blueprint $table) {
            $table->id('route_id');
            $table->unsignedBigInteger('origin_station_id');
            $table->unsignedBigInteger('destination_station_id');
            $table->decimal('rt_distance_km', 6, 2)->nullable();
            $table->integer('rt_duration_min')->nullable();

            $table->foreign('origin_station_id')->references('station_id')->on('station')->onUpdate('cascade');
            $table->foreign('destination_station_id')->references('station_id')->on('station')->onUpdate('cascade');
            $table->index(['origin_station_id', 'destination_station_id'], 'idx_route_origin_dest');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route');
    }
};
