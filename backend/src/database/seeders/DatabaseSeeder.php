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
            SeatSeeder::class,
            UserSeeder::class,
        ]);
    }
}
