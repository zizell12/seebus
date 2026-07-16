<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact', function (Blueprint $table) {
            $table->id('contact_id');
            $table->string('ct_name', 100);
            $table->string('ct_email', 100);
            $table->string('ct_phone', 20);
            $table->string('ct_nationality', 50)->default('Indonesia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact');
    }
};
