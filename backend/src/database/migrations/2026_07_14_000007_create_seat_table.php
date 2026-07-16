<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat', function (Blueprint $table) {
            $table->id('seat_id');
            $table->unsignedBigInteger('availability_id');
            $table->string('seat_number', 5);
            $table->enum('seat_status', ['empty', 'locked', 'booked'])->default('empty');
            $table->string('seat_locked_session', 100)->nullable();
            $table->dateTime('seat_locked_until')->nullable();

            $table->foreign('availability_id')->references('availability_id')->on('availability')
                ->onDelete('cascade')->onUpdate('cascade');
            $table->unique(['availability_id', 'seat_number'], 'uq_seat');
            $table->index(['availability_id', 'seat_status'], 'idx_seat_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat');
    }
};
