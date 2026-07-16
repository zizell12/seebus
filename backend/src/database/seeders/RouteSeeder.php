<?php

namespace Database\Seeders;

use App\Models\Route;
use App\Models\Station;
use Illuminate\Database\Seeder;

class RouteSeeder extends Seeder
{
    public function run(): void
    {
        $routes = [
            ['from' => 'Terminal Tawang Alun', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 210, 'min' => 300],
            ['from' => 'Terminal Tawang Alun', 'to' => 'Terminal Ubung', 'km' => 320, 'min' => 480],
            ['from' => 'Terminal Arjosari', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 95, 'min' => 150],
            ['from' => 'Terminal Sritanjung', 'to' => 'Terminal Ubung', 'km' => 180, 'min' => 300],
        ];

        foreach ($routes as $r) {
            $origin = Station::where('stn_name', $r['from'])->first();
            $destination = Station::where('stn_name', $r['to'])->first();

            Route::create([
                'origin_station_id' => $origin->station_id,
                'destination_station_id' => $destination->station_id,
                'rt_distance_km' => $r['km'],
                'rt_duration_min' => $r['min'],
            ]);
        }
    }
}
