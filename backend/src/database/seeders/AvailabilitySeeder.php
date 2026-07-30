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
            // Seed data jadwal real untuk 14 hari ke depan per rute, supaya ada
            // banyak variasi tanggal, jam, tipe bus, dan harga untuk dicoba di
            // fitur pencarian & filter (jadwal tidak lagi digenerate otomatis
            // saat dicari, murni pakai data yang sudah di-seed di sini).
            for ($day = 0; $day < 14; $day++) {
                $tanggal = Carbon::now()->addDays($day)->toDateString();
                AvailabilityGenerator::ensureForRouteAndDate($route, $tanggal);
            }
        }
    }
}