<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\AvailabilityLeg;
use App\Models\BusUnit;
use App\Models\Route;

class AvailabilityGenerator
{
    private const JAM_BERANGKAT = ['00:30:00', '06:00:00', '09:30:00', '14:00:00', '20:00:00'];

    /**
     * Dipakai oleh AdminJadwalController::store() saat admin menambah satu
     * jadwal baru secara manual. Harga TIDAK diinput manual lagi -- otomatis
     * dihitung dari harga per etape (route_stop) yang sudah didaftarkan
     * untuk rute ini, supaya harga selalu konsisten dengan data rute.
     */
    public static function createAvailability(Route $route, BusUnit $busUnit, string $date, string $time): Availability
    {
        $availability = Availability::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'av_date' => $date,
            'av_time' => $time,
            'av_price' => RouteFareCalculator::fullRoutePrice($route),
            'av_status' => 'active',
            'av_seats' => $busUnit->bu_capacity,
        ]);

        self::generateLegs($availability, $route);

        return $availability;
    }

    /**
     * Pastikan route ini punya jadwal (availability) untuk tanggal tertentu.
     * Kalau belum ada, generate untuk semua armada (bus_unit) yang aktif.
     * Aman dipanggil berkali-kali (tidak akan bikin duplikat).
     */
    public static function ensureForRouteAndDate(Route $route, string $date): void
    {
        $busUnits = BusUnit::where('is_active', true)->get();

        $existingBusUnitIds = Availability::where('route_id', $route->route_id)
            ->where('av_date', $date)
            ->pluck('bus_unit_id')
            ->all();

        foreach ($busUnits as $index => $busUnit) {
            if (in_array($busUnit->bus_unit_id, $existingBusUnitIds, true)) {
                continue; // sudah ada, skip biar tidak dobel
            }

            self::createAvailability(
                $route,
                $busUnit,
                $date,
                self::JAM_BERANGKAT[$index % count(self::JAM_BERANGKAT)],
            );
        }
    }

    /**
     * Generate baris availability_leg untuk tiap etape di rute ini -- dipakai
     * buat ngecek & mengurangi stok kursi per etape saat ada booking.
     * Ini gantinya generateSeats() versi lama yang bikin baris per nomor
     * kursi (A1, B1, dst) -- sekarang cuma satu baris stok per etape.
     */
    public static function generateLegs(Availability $availability, Route $route): void
    {
        $stops = $route->stops()->where('stop_order', '>', 0)->get();

        $legRows = $stops->map(fn ($stop) => [
            'availability_id' => $availability->availability_id,
            'route_stop_id' => $stop->route_stop_id,
            'seats_booked' => 0,
            'created_at' => now(),
        ])->all();

        if ($legRows) {
            AvailabilityLeg::insert($legRows);
        }
    }
}
