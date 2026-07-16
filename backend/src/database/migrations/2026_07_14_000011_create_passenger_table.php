<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passenger', function (Blueprint $table) {
            $table->id('passenger_id');
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('seat_id')->nullable();
            $table->enum('ps_category', ['adult', 'child', 'infant'])->default('adult');
            $table->string('ps_name', 100);
            $table->integer('ps_age');
            $table->enum('ps_gender', ['male', 'female']);
            $table->string('ps_nationality', 50)->default('Indonesia');

            $table->foreign('booking_id')->references('booking_id')->on('booking')
                ->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('seat_id')->references('seat_id')->on('seat')->onUpdate('cascade');
            $table->unique('seat_id', 'uq_passenger_seat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger');
    }
};
