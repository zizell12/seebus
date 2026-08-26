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
        'Sleeper' => 250000,
    ];

    private const JAM_BERANGKAT = ['00:30:00', '06:00:00', '09:30:00', '14:00:00', '20:00:00'];

    // Setiap kategori bus punya susunan kursi (kolom) berbeda supaya mapping
    // kursinya juga terasa beda saat dicoba: Ekonomi 2-3 (5 kolom), Eksekutif
    // 2-1 (3 kolom), Sleeper 1-1 (2 kolom, kabin/kasur individu).
    private const SEAT_COLUMNS_BY_CATEGORY = [
        'Ekonomi' => ['A', 'B', 'C', 'D', 'E'],
        'Eksekutif' => ['A', 'B', 'C'],
        'Sleeper' => ['A', 'B'],
    ];

    /**
     * Dipakai oleh AdminJadwalController::store() saat admin menambah satu
     * jadwal baru secara manual lewat panel admin (rute, tipe bus, tanggal,
     * jam, dan harga dipilih sendiri oleh admin, beda dengan
     * ensureForRouteAndDate() yang generate otomatis berdasarkan harga default).
     */
    public static function createAvailability(
        Route $route,
        BusType $busType,
        string $date,
        string $time,
        int $hargaDewasa,
        int $hargaAnak,
    ): Availability {
        $availability = Availability::create([
            'route_id' => $route->route_id,
            'bus_type_id' => $busType->bus_type_id,
            'av_date' => $date,
            'av_time' => $time,
            'av_price' => [
                'adult' => $hargaDewasa,
                'child' => $hargaAnak,
            ],
            'av_status' => 'active',
            'av_seats' => $busType->bt_capacity,
        ]);

        self::generateSeats($availability, $busType->bt_capacity ?? 32, $busType->bt_name);

        return $availability;
    }

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

            self::generateSeats($availability, $busType->bt_capacity ?? 32, $busType->bt_name);
        }
    }

    /**
     * Dipakai juga oleh AdminJadwalController saat admin menambah jadwal baru
     * secara manual lewat panel admin, supaya kursi otomatis ter-generate
     * sesuai kategori bus (Ekonomi/Eksekutif/Sleeper) yang dipilih.
     */
    public static function generateSeats(Availability $availability, int $capacity, string $kategori): void
    {
        $columns = self::SEAT_COLUMNS_BY_CATEGORY[$kategori] ?? ['A', 'B', 'C', 'D'];
        $rows = (int) ceil($capacity / count($columns));
        $seatCount = 0;
        $seatRows = [];

        for ($row = 1; $row <= $rows; $row++) {
            foreach ($columns as $col) {
                if ($seatCount >= $capacity) {
                    break 2;
                }

                $seatRows[] = [
                    'availability_id' => $availability->availability_id,
                    'seat_number' => "{$col}{$row}",
                    'seat_status' => 'empty',
                ];

                $seatCount++;
            }
        }

        // Insert semua kursi sekaligus dalam 1 query (bulk insert) alih-alih
        // satu query per kursi. Untuk seeding awal ini bedanya ribuan query
        // individual jadi cuma satu query per availability -- jauh lebih
        // cepat, terutama waktu jalanin `php artisan migrate --seed`.
        if ($seatRows) {
            Seat::insert($seatRows);
        }
    }
}