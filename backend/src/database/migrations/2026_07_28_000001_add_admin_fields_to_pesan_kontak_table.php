<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pesan_kontak', function (Blueprint $table) {
            $table->string('subjek', 50)->default('Pertanyaan Umum')->after('email');
            $table->enum('status', ['baru', 'dibaca'])->default('baru')->after('pesan');
        });
    }

    public function down(): void
    {
        Schema::table('pesan_kontak', function (Blueprint $table) {
            $table->dropColumn(['subjek', 'status']);
        });
    }
};
