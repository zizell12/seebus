<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('passenger', function (Blueprint $table) {
            $table->dropForeign(['seat_id']);
            $table->dropUnique('uq_passenger_seat');
            $table->dropColumn('seat_id');

            $table->unsignedBigInteger('from_stop_id')->nullable()->after('booking_id');
            $table->unsignedBigInteger('to_stop_id')->nullable()->after('from_stop_id');

            $table->foreign('from_stop_id')->references('route_stop_id')->on('route_stop')->onUpdate('cascade');
            $table->foreign('to_stop_id')->references('route_stop_id')->on('route_stop')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('passenger', function (Blueprint $table) {
            $table->dropForeign(['from_stop_id']);
            $table->dropForeign(['to_stop_id']);
            $table->dropColumn(['from_stop_id', 'to_stop_id']);

            $table->unsignedBigInteger('seat_id')->nullable()->after('booking_id');
        });
    }
};