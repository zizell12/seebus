<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RegionSeeder::class,
            StationSeeder::class,
            RouteSeeder::class,
            CompanySeeder::class,
            BusTypeSeeder::class,
            AvailabilitySeeder::class,
            // SeatSeeder sudah tidak dipakai lagi: kursi sekarang otomatis
            // dibuat oleh AvailabilityGenerator setiap kali jadwal dibuat
            // (baik saat seeding maupun saat auto-generate on-demand).
            UserSeeder::class,
        ]);
    }
}