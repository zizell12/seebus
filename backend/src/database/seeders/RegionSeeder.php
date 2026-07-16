<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['rg_district' => 'Sumbersari', 'rg_city' => 'Jember', 'rg_province' => 'Jawa Timur'],
            ['rg_district' => 'Gubeng', 'rg_city' => 'Surabaya', 'rg_province' => 'Jawa Timur'],
            ['rg_district' => 'Klojen', 'rg_city' => 'Malang', 'rg_province' => 'Jawa Timur'],
            ['rg_district' => 'Giri', 'rg_city' => 'Banyuwangi', 'rg_province' => 'Jawa Timur'],
            ['rg_district' => 'Denpasar Selatan', 'rg_city' => 'Denpasar', 'rg_province' => 'Bali'],
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }
    }
}
