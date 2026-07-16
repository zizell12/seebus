<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pesan_kontak', function (Blueprint $table) {
            $table->id('pesan_id');
            $table->string('nama', 100);
            $table->string('email', 100);
            $table->text('pesan');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pesan_kontak');
    }
};
