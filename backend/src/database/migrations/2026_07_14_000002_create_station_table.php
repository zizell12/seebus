<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('station', function (Blueprint $table) {
            $table->id('station_id');
            $table->unsignedBigInteger('region_id');
            $table->string('stn_name', 150);
            $table->string('stn_address', 255)->nullable();

            $table->foreign('region_id')->references('region_id')->on('region')->onUpdate('cascade');
            $table->index('region_id', 'idx_station_region');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('station');
    }
};
