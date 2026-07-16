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
