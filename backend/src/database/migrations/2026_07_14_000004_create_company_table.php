<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company', function (Blueprint $table) {
            $table->id('company_id');
            $table->string('co_name', 150);
            $table->string('co_address', 255)->nullable();
            $table->string('co_phone', 20)->nullable();
            $table->string('co_email', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company');
    }
};
