<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availability_leg', function (Blueprint $table) {
            $table->id('availability_leg_id');
            $table->unsignedBigInteger('availability_id');
            $table->unsignedBigInteger('route_stop_id'); // etape yang BERAKHIR di titik ini
            $table->unsignedInteger('seats_booked')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('availability_id')->references('availability_id')->on('availability')
                ->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('route_stop_id')->references('route_stop_id')->on('route_stop')->onUpdate('cascade');
            $table->unique(['availability_id', 'route_stop_id'], 'uq_availability_leg');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_leg');
    }
};
