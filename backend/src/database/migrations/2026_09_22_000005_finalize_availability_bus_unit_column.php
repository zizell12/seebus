<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('availability', function (Blueprint $table) {
            $table->dropForeign(['bus_type_id']);
            $table->dropColumn('bus_type_id');
            $table->unsignedBigInteger('bus_unit_id')->nullable(false)->change();
            $table->foreign('bus_unit_id')->references('bus_unit_id')->on('bus_unit')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('availability', function (Blueprint $table) {
            $table->dropForeign(['bus_unit_id']);
            $table->unsignedBigInteger('bus_type_id')->nullable()->after('route_id');
        });
    }
};
