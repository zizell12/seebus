<?php

namespace Database\Seeders;

use App\Models\BusType;
use App\Models\Company;
use Illuminate\Database\Seeder;

class BusTypeSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();

        $busTypes = [
            ['bt_name' => 'Ekonomi', 'bt_capacity' => 40],
            ['bt_name' => 'Eksekutif', 'bt_capacity' => 30],
            ['bt_name' => 'Sleeper', 'bt_capacity' => 20],
        ];

        foreach ($busTypes as $b) {
            BusType::firstOrCreate(
                ['company_id' => $company->company_id, 'bt_name' => $b['bt_name']],
                ['bt_capacity' => $b['bt_capacity']]
            );
        }
    }
}
