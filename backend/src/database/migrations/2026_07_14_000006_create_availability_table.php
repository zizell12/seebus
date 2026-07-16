<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availability', function (Blueprint $table) {
            $table->id('availability_id');
            $table->unsignedBigInteger('route_id');
            $table->unsignedBigInteger('bus_type_id');
            $table->date('av_date');
            $table->time('av_time');
            $table->longText('av_price'); // JSON string, contoh: {"adult":150000,"child":100000}
            $table->enum('av_status', ['active', 'inactive'])->default('active');
            $table->integer('av_seats');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('route_id')->references('route_id')->on('route')->onUpdate('cascade');
            $table->foreign('bus_type_id')->references('bus_type_id')->on('bus_type')->onUpdate('cascade');
            $table->index(['route_id', 'av_date', 'av_status'], 'idx_availability_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability');
    }
};
