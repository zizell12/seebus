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
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Tawang Alun', 'km' => 210, 'min' => 300],
            ['from' => 'Terminal Tawang Alun', 'to' => 'Terminal Ubung', 'km' => 320, 'min' => 480],
            ['from' => 'Terminal Ubung', 'to' => 'Terminal Tawang Alun', 'km' => 320, 'min' => 480],
            ['from' => 'Terminal Arjosari', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 95, 'min' => 150],
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Arjosari', 'km' => 95, 'min' => 150],
            ['from' => 'Terminal Sritanjung', 'to' => 'Terminal Ubung', 'km' => 180, 'min' => 300],
            ['from' => 'Terminal Ubung', 'to' => 'Terminal Sritanjung', 'km' => 180, 'min' => 300],
            ['from' => 'Terminal Sritanjung', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 290, 'min' => 420],
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Sritanjung', 'km' => 290, 'min' => 420],
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Giwangan', 'km' => 320, 'min' => 420],
            ['from' => 'Terminal Giwangan', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 320, 'min' => 420],
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Tirtonadi', 'km' => 260, 'min' => 360],
            ['from' => 'Terminal Tirtonadi', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 260, 'min' => 360],
            ['from' => 'Terminal Tirtonadi', 'to' => 'Terminal Mangkang', 'km' => 100, 'min' => 150],
            ['from' => 'Terminal Mangkang', 'to' => 'Terminal Tirtonadi', 'km' => 100, 'min' => 150],
            ['from' => 'Terminal Mangkang', 'to' => 'Terminal Cicaheum', 'km' => 370, 'min' => 480],
            ['from' => 'Terminal Cicaheum', 'to' => 'Terminal Mangkang', 'km' => 370, 'min' => 480],
            ['from' => 'Terminal Cicaheum', 'to' => 'Terminal Pulo Gebang', 'km' => 150, 'min' => 210],
            ['from' => 'Terminal Pulo Gebang', 'to' => 'Terminal Cicaheum', 'km' => 150, 'min' => 210],
            ['from' => 'Terminal Purabaya (Bungurasih)', 'to' => 'Terminal Pulo Gebang', 'km' => 800, 'min' => 720],
            ['from' => 'Terminal Pulo Gebang', 'to' => 'Terminal Purabaya (Bungurasih)', 'km' => 800, 'min' => 720],
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