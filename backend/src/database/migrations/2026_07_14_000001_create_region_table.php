<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('region', function (Blueprint $table) {
            $table->id('region_id');
            $table->string('rg_district', 100);
            $table->string('rg_city', 100);
            $table->string('rg_province', 100);

            $table->unique(['rg_district', 'rg_city', 'rg_province'], 'uq_region');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('region');
    }
};
