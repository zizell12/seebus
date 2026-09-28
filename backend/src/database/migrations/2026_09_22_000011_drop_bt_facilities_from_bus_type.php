<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bus_type', function (Blueprint $table) {
            $table->dropColumn('bt_facilities');
        });
    }

    public function down(): void
    {
        Schema::table('bus_type', function (Blueprint $table) {
            $table->string('bt_facilities', 255)->nullable();
        });
    }
};
