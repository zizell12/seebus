<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_stop', function (Blueprint $table) {
            $table->id('route_stop_id');
            $table->unsignedBigInteger('route_id');
            $table->unsignedBigInteger('station_id');
            $table->unsignedTinyInteger('stop_order'); // 0 = titik keberangkatan paling awal

            $table->enum('stop_type', ['pickup', 'dropoff', 'both'])->default('both');
            $table->unsignedInteger('offset_minutes')->default(0); // estimasi menit dari titik awal

            // Harga ETAPE: dari titik sebelumnya (stop_order - 1) sampai titik ini.
            // Untuk stop_order = 0 (titik paling awal), kolom ini dibiarkan NULL
            // karena tidak ada "etape sebelumnya".
            $table->decimal('fare_adult', 10, 2)->nullable();
            $table->decimal('fare_child', 10, 2)->nullable();
            $table->decimal('fare_infant', 10, 2)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->foreign('route_id')->references('route_id')->on('route')
                ->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('station_id')->references('station_id')->on('station')->onUpdate('cascade');
            $table->unique(['route_id', 'stop_order'], 'uq_route_stop_order');
            $table->index(['route_id', 'station_id'], 'idx_route_stop_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_stop');
    }
};
