<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('availability', function (Blueprint $table) {
            // Nullable dulu -- diisi di migration berikutnya (data migration),
            // baru dikunci NOT NULL setelah semua baris lama terisi.
            $table->unsignedBigInteger('bus_unit_id')->nullable()->after('bus_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('availability', function (Blueprint $table) {
            $table->dropColumn('bus_unit_id');
        });
    }
};
