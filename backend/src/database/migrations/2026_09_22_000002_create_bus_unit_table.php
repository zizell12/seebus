<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_unit', function (Blueprint $table) {
            $table->id('bus_unit_id');
            $table->unsignedBigInteger('bus_type_id'); // kelas: ekonomi/eksekutif/sleeper
            $table->string('bu_code', 100);            // contoh: "ramatrans unit 1"
            $table->string('bu_plate_number', 20)->nullable();
            $table->unsignedInteger('bu_capacity');    // kapasitas kursi armada ini
            $table->json('bu_facilities')->nullable(); // contoh: ["ac","wifi","toilet"]
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('bus_type_id')->references('bus_type_id')->on('bus_type')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_unit');
    }
};
