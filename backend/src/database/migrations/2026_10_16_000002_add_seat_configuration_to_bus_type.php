<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bus_type', function (Blueprint $table) {
            $table->boolean('bt_use_seat_number')->default(false)->after('bt_name');
            $table->string('bt_seat_pattern', 20)->nullable()->after('bt_use_seat_number');
        });

        DB::table('bus_type')
            ->where(function ($query) {
                $query->whereRaw('LOWER(bt_name) LIKE ?', ['%eksekutif%'])
                    ->orWhereRaw('LOWER(bt_name) LIKE ?', ['%executive%'])
                    ->orWhereRaw('LOWER(bt_name) LIKE ?', ['%sleeper%']);
            })
            ->update(['bt_use_seat_number' => true]);

        DB::table('bus_type')
            ->where(function ($query) {
                $query->whereRaw('LOWER(bt_name) LIKE ?', ['%sleeper%']);
            })
            ->update(['bt_seat_pattern' => '1-2']);

        DB::table('bus_type')
            ->where(function ($query) {
                $query->whereRaw('LOWER(bt_name) LIKE ?', ['%eksekutif%'])
                    ->orWhereRaw('LOWER(bt_name) LIKE ?', ['%executive%']);
            })
            ->update(['bt_seat_pattern' => '2-2']);
    }

    public function down(): void
    {
        Schema::table('bus_type', function (Blueprint $table) {
            $table->dropColumn(['bt_use_seat_number', 'bt_seat_pattern']);
        });
    }
};
