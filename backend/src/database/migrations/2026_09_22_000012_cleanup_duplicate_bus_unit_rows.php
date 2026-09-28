<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL tidak membungkus migration dalam transaksi (beda dengan
        // SQLite/Postgres), jadi migration nomor 4 yang sempat gagal
        // berkali-kali sebelum akhirnya sukses itu ninggalin baris bus_unit
        // "sampah" yang sudah kepalang tercatat, meskipun migration-nya
        // sendiri dianggap gagal. Baris yang BENERAN kepakai sekarang
        // adalah yang direferensikan oleh availability atau schedule_template
        // -- sisanya aman dihapus.
        $usedIds = DB::table('availability')->whereNotNull('bus_unit_id')->pluck('bus_unit_id')
            ->merge(DB::table('schedule_template')->whereNotNull('bus_unit_id')->pluck('bus_unit_id'))
            ->unique()
            ->all();

        DB::table('bus_unit')->whereNotIn('bus_unit_id', $usedIds)->delete();
    }

    public function down(): void
    {
        // Pembersihan data sampah -- tidak didesain untuk rollback.
    }
};
