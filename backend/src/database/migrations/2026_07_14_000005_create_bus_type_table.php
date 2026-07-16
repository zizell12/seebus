<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_type', function (Blueprint $table) {
            $table->id('bus_type_id');
            $table->unsignedBigInteger('company_id');
            $table->string('bt_name', 100);
            $table->integer('bt_capacity');
            $table->string('bt_facilities', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('company_id')->references('company_id')->on('company')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_type');
    }
};
