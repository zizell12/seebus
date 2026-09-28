<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('region')->update([
            'rg_district' => DB::raw('LOWER(rg_district)'),
            'rg_city' => DB::raw('LOWER(rg_city)'),
            'rg_province' => DB::raw('LOWER(rg_province)'),
        ]);
        DB::table('station')->update(['stn_name' => DB::raw('LOWER(stn_name)')]);
        DB::table('company')->update(['co_name' => DB::raw('LOWER(co_name)')]);
        DB::table('bus_type')->update(['bt_name' => DB::raw('LOWER(bt_name)')]);
    }

    public function down(): void
    {
        // Sengaja tidak ada rollback -- data lama & baru sudah tercampur.
    }
};
