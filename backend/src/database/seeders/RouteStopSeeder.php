<?php

namespace Database\Seeders;

use App\Models\Route;
use App\Models\RouteStop;
use Illuminate\Database\Seeder;

class RouteStopSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Route::all() as $route) {
            if (RouteStop::where('route_id', $route->route_id)->exists()) {
                continue;
            }

            $tarifDewasa = max(25000, (int) (round(($route->rt_distance_km * 450) / 5000) * 5000));
            $tarifAnak = (int) (round(($tarifDewasa * 0.75) / 5000) * 5000);

            RouteStop::create([
                'route_id' => $route->route_id,
                'station_id' => $route->origin_station_id,
                'stop_order' => 0,
                'stop_type' => 'both',
                'offset_minutes' => 0,
            ]);

            RouteStop::create([
                'route_id' => $route->route_id,
                'station_id' => $route->destination_station_id,
                'stop_order' => 1,
                'stop_type' => 'both',
                'offset_minutes' => (int) $route->rt_duration_min,
                'fare_adult' => $tarifDewasa,
                'fare_child' => $tarifAnak,
                'fare_infant' => 0,
            ]);
        }
    }
}
