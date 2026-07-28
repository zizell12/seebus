<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\Station;
use Illuminate\Database\Seeder;

class StationSeeder extends Seeder
{
    public function run(): void
    {
        $stations = [
            ['city' => 'Jember', 'stn_name' => 'Terminal Tawang Alun', 'stn_address' => 'Jl. Brawijaya, Jember'],
            ['city' => 'Surabaya', 'stn_name' => 'Terminal Purabaya (Bungurasih)', 'stn_address' => 'Waru, Surabaya'],
            ['city' => 'Malang', 'stn_name' => 'Terminal Arjosari', 'stn_address' => 'Blimbing, Malang'],
            ['city' => 'Banyuwangi', 'stn_name' => 'Terminal Sritanjung', 'stn_address' => 'Giri, Banyuwangi'],
            ['city' => 'Denpasar', 'stn_name' => 'Terminal Ubung', 'stn_address' => 'Denpasar Selatan, Bali'],
            ['city' => 'Yogyakarta', 'stn_name' => 'Terminal Giwangan', 'stn_address' => 'Umbulharjo, Yogyakarta'],
            ['city' => 'Surakarta', 'stn_name' => 'Terminal Tirtonadi', 'stn_address' => 'Banjarsari, Surakarta'],
            ['city' => 'Semarang', 'stn_name' => 'Terminal Mangkang', 'stn_address' => 'Semarang Utara, Semarang'],
            ['city' => 'Bandung', 'stn_name' => 'Terminal Cicaheum', 'stn_address' => 'Kiaracondong, Bandung'],
            ['city' => 'Jakarta Timur', 'stn_name' => 'Terminal Pulo Gebang', 'stn_address' => 'Cakung, Jakarta Timur'],
        ];

        foreach ($stations as $s) {
            $region = Region::where('rg_city', $s['city'])->first();

            Station::create([
                'region_id' => $region->region_id,
                'stn_name' => $s['stn_name'],
                'stn_address' => $s['stn_address'],
            ]);
        }
    }
}