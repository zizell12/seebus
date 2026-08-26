<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fitur "Profil Perusahaan" di panel admin sudah dihapus -- konten
     * halaman "Perusahaan" & "Hubungi Kami" sekarang ditulis langsung di
     * kode frontend, bukan diambil dari database lagi. Jadi kolom-kolom
     * tambahan ini (ditambahkan oleh migration
     * 2026_08_14_000001_add_profile_fields_to_company_table) sudah tidak
     * dipakai sama sekali. Tabel "company" dikembalikan ke bentuk
     * sederhananya semula: company_id, co_name, co_address, co_phone,
     * co_email, created_at.
     */
    public function up(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->dropColumn([
                'co_badge_sejak',
                'co_hero_judul_id', 'co_hero_judul_en',
                'co_hero_deskripsi_id', 'co_hero_deskripsi_en',
                'co_misi_kutipan_id', 'co_misi_kutipan_en',
                'co_aman_judul_id', 'co_aman_judul_en',
                'co_aman_deskripsi_id', 'co_aman_deskripsi_en',
                'co_stat_armada', 'co_stat_rute', 'co_stat_penumpang',
                'co_komitmen_judul_id', 'co_komitmen_judul_en',
                'co_komitmen_deskripsi_id', 'co_komitmen_deskripsi_en',
                'co_cs_phone', 'co_whatsapp',
                'co_map_lat', 'co_map_lng',
            ]);
        });
    }

    /**
     * Kalau perlu di-rollback, kolomnya dibuat ulang (kosong lagi, data
     * lama yang sudah terlanjur dihapus oleh up() TIDAK bisa balik).
     */
    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->string('co_badge_sejak', 50)->nullable()->after('co_name');

            $table->string('co_hero_judul_id', 200)->nullable();
            $table->string('co_hero_judul_en', 200)->nullable();
            $table->text('co_hero_deskripsi_id')->nullable();
            $table->text('co_hero_deskripsi_en')->nullable();

            $table->text('co_misi_kutipan_id')->nullable();
            $table->text('co_misi_kutipan_en')->nullable();

            $table->string('co_aman_judul_id', 200)->nullable();
            $table->string('co_aman_judul_en', 200)->nullable();
            $table->text('co_aman_deskripsi_id')->nullable();
            $table->text('co_aman_deskripsi_en')->nullable();

            $table->string('co_stat_armada', 20)->nullable();
            $table->string('co_stat_rute', 20)->nullable();
            $table->string('co_stat_penumpang', 20)->nullable();

            $table->string('co_komitmen_judul_id', 200)->nullable();
            $table->string('co_komitmen_judul_en', 200)->nullable();
            $table->text('co_komitmen_deskripsi_id')->nullable();
            $table->text('co_komitmen_deskripsi_en')->nullable();

            $table->string('co_cs_phone', 20)->nullable();
            $table->string('co_whatsapp', 20)->nullable();

            $table->decimal('co_map_lat', 10, 7)->nullable();
            $table->decimal('co_map_lng', 10, 7)->nullable();
        });
    }
};
