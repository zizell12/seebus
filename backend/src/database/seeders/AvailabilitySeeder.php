<?php

namespace Database\Seeders;

use App\Models\Availability;
use App\Models\BusType;
use App\Models\Route;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $routes = Route::all();
        $busTypes = BusType::all();

        // Harga dasar per kategori bus (nama harus sama dengan bt_name di BusTypeSeeder)
        $basePriceByCategory = [
            'Ekonomi' => 120000,
            'Eksekutif' => 180000,
            'Suite Class' => 250000,
        ];

        $jamBerangkat = ['06:00:00', '09:30:00', '14:00:00'];

        foreach ($routes as $route) {
            foreach ($busTypes as $index => $busType) {
                // Bikin jadwal untuk 5 hari ke depan, satu jadwal per hari per kombinasi bus
                for ($day = 0; $day < 5; $day++) {
                    $harga = $basePriceByCategory[$busType->bt_name] ?? 120000;

                    Availability::create([
                        'route_id' => $route->route_id,
                        'bus_type_id' => $busType->bus_type_id,
                        'av_date' => Carbon::now()->addDays($day)->toDateString(),
                        'av_time' => $jamBerangkat[$index % count($jamBerangkat)],
                        'av_price' => [
                            'adult' => $harga,
                            'child' => (int) ($harga * 0.75),
                        ],
                        'av_status' => 'active',
                        'av_seats' => $busType->bt_capacity,
                    ]);
                }
            }
        }
    }
}
