<?php

namespace Database\Seeders;

use App\Models\BusType;
use App\Models\Company;
use Illuminate\Database\Seeder;

class BusTypeSeeder extends Seeder
{
    public function run(): void
    {
        $busTypes = [
            ['company' => 'Sinar Jaya', 'bt_name' => 'Ekonomi', 'bt_capacity' => 32, 'bt_facilities' => 'AC, Kursi Standar'],
            ['company' => 'Rosalia Indah', 'bt_name' => 'Eksekutif', 'bt_capacity' => 28, 'bt_facilities' => 'AC, Reclining Seat, Bantal & Selimut'],
            ['company' => 'Gunung Harta', 'bt_name' => 'Suite Class', 'bt_capacity' => 20, 'bt_facilities' => 'AC, Kursi 2-2, Snack, USB Charger'],
        ];

        foreach ($busTypes as $b) {
            $company = Company::where('co_name', $b['company'])->first();

            BusType::create([
                'company_id' => $company->company_id,
                'bt_name' => $b['bt_name'],
                'bt_capacity' => $b['bt_capacity'],
                'bt_facilities' => $b['bt_facilities'],
            ]);
        }
    }
}
