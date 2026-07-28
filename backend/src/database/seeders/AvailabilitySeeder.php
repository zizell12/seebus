<?php

namespace Database\Seeders;

use App\Models\Route;
use App\Services\AvailabilityGenerator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $routes = Route::all();

        foreach ($routes as $route) {
            // Seed awal untuk 5 hari ke depan. Setelah ini, JadwalController
            // akan otomatis generate jadwal baru on-demand untuk tanggal
            // manapun yang dicari (lihat App\Services\AvailabilityGenerator),
            // jadi jadwal tidak akan pernah kosong lagi walau tanggalnya lewat.
            for ($day = 0; $day < 5; $day++) {
                $tanggal = Carbon::now()->addDays($day)->toDateString();
                AvailabilityGenerator::ensureForRouteAndDate($route, $tanggal);
            }
        }
    }
}