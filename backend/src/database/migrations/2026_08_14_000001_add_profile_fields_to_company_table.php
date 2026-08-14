<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
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

    public function down(): void
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
};