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
            ['rg_district' => 'Umbulharjo', 'rg_city' => 'Yogyakarta', 'rg_province' => 'DI Yogyakarta'],
            ['rg_district' => 'Banjarsari', 'rg_city' => 'Surakarta', 'rg_province' => 'Jawa Tengah'],
            ['rg_district' => 'Semarang Utara', 'rg_city' => 'Semarang', 'rg_province' => 'Jawa Tengah'],
            ['rg_district' => 'Kiaracondong', 'rg_city' => 'Bandung', 'rg_province' => 'Jawa Barat'],
            ['rg_district' => 'Cakung', 'rg_city' => 'Jakarta Timur', 'rg_province' => 'DKI Jakarta'],
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }
    }
}