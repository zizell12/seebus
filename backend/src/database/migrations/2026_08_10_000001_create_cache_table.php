<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel ini WAJIB ada kalau CACHE_STORE=database (default bawaan Laravel,
 * dan juga default di .env.example project ini). Sebelum migration ini,
 * kalau .env tidak secara eksplisit mengarahkan cache ke driver lain,
 * apa pun yang menyentuh cache (termasuk middleware `throttle` yang dipakai
 * di endpoint /booking/lookup) akan gagal dengan error:
 * "SQLSTATE[42S02]: Base table or view not found ... Table 'cache' doesn't exist".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};
