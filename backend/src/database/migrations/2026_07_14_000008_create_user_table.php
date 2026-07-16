<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user', function (Blueprint $table) {
            $table->id('user_id');
            $table->string('usr_name', 100);
            $table->string('usr_email', 100)->unique();
            $table->string('usr_password_hash', 255);
            $table->enum('usr_role', ['customer', 'admin'])->default('customer');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
