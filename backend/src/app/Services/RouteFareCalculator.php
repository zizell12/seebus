<?php

namespace App\Services;

use App\Models\Route;
use App\Models\RouteStop;
use Illuminate\Support\Collection;

class RouteFareCalculator
{
    /**
     * Hitung total harga (dewasa/anak/bayi) dari satu titik naik ke satu
     * titik turun, dengan menjumlahkan harga semua etape yang dilewati.
     * Tiap route_stop (kecuali stop_order = 0) menyimpan harga ETAPE dari
     * titik sebelumnya sampai titik itu sendiri.
     */
    public static function calculate(RouteStop $from, RouteStop $to): array
    {
        $legs = self::legsBetween($from, $to);

        return [
            'adult' => (int) $legs->sum('fare_adult'),
            'child' => (int) $legs->sum('fare_child'),
            'infant' => (int) $legs->sum('fare_infant'),
        ];
    }

    /**
     * Semua etape (route_stop dengan stop_order > titik naik) yang dilewati
     * kalau penumpang naik dari $from sampai $to -- dipakai buat hitung
     * harga maupun buat generate/ngecek baris availability_leg.
     */
    public static function legsBetween(RouteStop $from, RouteStop $to): Collection
    {
        return RouteStop::where('route_id', $from->route_id)
            ->where('stop_order', '>', $from->stop_order)
            ->where('stop_order', '<=', $to->stop_order)
            ->orderBy('stop_order')
            ->get();
    }

    /**
     * Harga "mulai dari" rute penuh (titik paling awal sampai titik paling
     * akhir) -- dipakai sebagai cache tampilan di kartu hasil pencarian,
     * supaya tidak perlu hitung ulang tiap kali di-render.
     */
    public static function fullRoutePrice(Route $route): array
    {
        $stops = $route->stops; // sudah terurut stop_order lewat relasi

        if ($stops->count() < 2) {
            return ['adult' => 0, 'child' => 0, 'infant' => 0];
        }

        return self::calculate($stops->first(), $stops->last());
    }
}
