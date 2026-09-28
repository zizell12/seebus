<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            // Gantinya seat_locked_until (dulu per-kursi), sekarang hold
            // stoknya di level booking. Selama bk_status='pending' dan
            // bk_hold_until belum lewat, stok yang sudah "dipegang" booking
            // ini tetap dianggap terpakai (tidak bisa direbut booking lain).
            $table->timestamp('bk_hold_until')->nullable()->after('bk_status');
        });
    }

    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropColumn('bk_hold_until');
        });
    }
};
