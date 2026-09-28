<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('seat');
    }

    public function down(): void
    {
        // Sengaja tidak dibuat ulang otomatis -- kalau perlu, restore dari
        // backup .sql sebelum migration ini dijalankan.
    }
};
