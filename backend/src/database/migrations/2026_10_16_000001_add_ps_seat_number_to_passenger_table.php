<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('passenger', function (Blueprint $table) {
            $table->string('ps_seat_number', 5)->nullable()->after('to_stop_id');
        });
    }

    public function down(): void
    {
        Schema::table('passenger', function (Blueprint $table) {
            $table->dropColumn('ps_seat_number');
        });
    }
};
