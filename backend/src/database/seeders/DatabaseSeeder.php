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
            RouteStopSeeder::class,
            CompanySeeder::class,
            BusTypeSeeder::class,
            BusUnitSeeder::class,
            AvailabilitySeeder::class,
            UserSeeder::class,
        ]);
    }
}