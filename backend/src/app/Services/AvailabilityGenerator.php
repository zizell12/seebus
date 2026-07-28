<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\BusType;
use App\Models\Route;
use App\Models\Seat;
use Illuminate\Support\Carbon;

class AvailabilityGenerator
{
    // Sama seperti AvailabilitySeeder, biar harga & jam konsisten
    private const BASE_PRICE_BY_CATEGORY = [
        'Ekonomi' => 120000,
        'Eksekutif' => 180000,
        'Suite Class' => 250000,
    ];

    private const JAM_BERANGKAT = ['06:00:00', '09:30:00', '14:00:00'];

    private const SEAT_COLUMNS = ['A', 'B', 'C', 'D'];

    /**
     * Pastikan route ini punya jadwal (availability) untuk tanggal tertentu.
     * Kalau belum ada, generate untuk semua bus_type (sama seperti seeder awal).
     * Aman dipanggil berkali-kali (tidak akan bikin duplikat).
     */
    public static function ensureForRouteAndDate(Route $route, string $date): void
    {
        $busTypes = BusType::all();

        $existingBusTypeIds = Availability::where('route_id', $route->route_id)
            ->where('av_date', $date)
            ->pluck('bus_type_id')
            ->all();

        foreach ($busTypes as $index => $busType) {
            if (in_array($busType->bus_type_id, $existingBusTypeIds, true)) {
                continue; // sudah ada, skip biar tidak dobel
            }

            $harga = self::BASE_PRICE_BY_CATEGORY[$busType->bt_name] ?? 120000;

            $availability = Availability::create([
                'route_id' => $route->route_id,
                'bus_type_id' => $busType->bus_type_id,
                'av_date' => $date,
                'av_time' => self::JAM_BERANGKAT[$index % count(self::JAM_BERANGKAT)],
                'av_price' => [
                    'adult' => $harga,
                    'child' => (int) ($harga * 0.75),
                ],
                'av_status' => 'active',
                'av_seats' => $busType->bt_capacity,
            ]);

            self::generateSeats($availability, $busType->bt_capacity ?? 32);
        }
    }

    private static function generateSeats(Availability $availability, int $capacity): void
    {
        $rows = (int) ceil($capacity / count(self::SEAT_COLUMNS));
        $seatCount = 0;

        for ($row = 1; $row <= $rows; $row++) {
            foreach (self::SEAT_COLUMNS as $col) {
                if ($seatCount >= $capacity) {
                    break 2;
                }

                Seat::create([
                    'availability_id' => $availability->availability_id,
                    'seat_number' => "{$col}{$row}",
                    'seat_status' => 'empty',
                ]);

                $seatCount++;
            }
        }
    }
}