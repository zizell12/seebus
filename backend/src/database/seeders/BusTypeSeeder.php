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
            ['bt_name' => 'Ekonomi', 'bt_capacity' => 40, 'bt_use_seat_number' => false, 'bt_seat_pattern' => null],
            ['bt_name' => 'Eksekutif', 'bt_capacity' => 30, 'bt_use_seat_number' => true, 'bt_seat_pattern' => '2-2'],
            ['bt_name' => 'Sleeper', 'bt_capacity' => 20, 'bt_use_seat_number' => true, 'bt_seat_pattern' => '1-2'],
        ];

        foreach ($busTypes as $b) {
            $busType = BusType::where('company_id', $company->company_id)
                ->whereRaw('LOWER(bt_name) = ?', [mb_strtolower($b['bt_name'])])
                ->first();
            if (! $busType) {
                BusType::create([
                    'company_id' => $company->company_id,
                    'bt_name' => $b['bt_name'],
                    'bt_capacity' => $b['bt_capacity'],
                    'bt_use_seat_number' => $b['bt_use_seat_number'],
                    'bt_seat_pattern' => $b['bt_seat_pattern'],
                ]);
            }
        }
    }
}
