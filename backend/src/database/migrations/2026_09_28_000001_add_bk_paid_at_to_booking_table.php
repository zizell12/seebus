<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->timestamp('bk_paid_at')->nullable();
            $table->index(['bk_status', 'bk_paid_at'], 'idx_booking_paid_at');
        });

        DB::table('booking')
            ->where('bk_status', 'paid')
            ->whereNull('bk_paid_at')
            ->update(['bk_paid_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropIndex('idx_booking_paid_at');
            $table->dropColumn('bk_paid_at');
        });
    }
};