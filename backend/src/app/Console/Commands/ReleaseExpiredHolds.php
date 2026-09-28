<?php

namespace App\Console\Commands;

use App\Models\AvailabilityLeg;
use App\Models\Booking;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReleaseExpiredHolds extends Command
{
    /**
     * php artisan bookings:release-expired-holds
     *
     * Tanpa command ini, stok kursi yang sempat "dipegang" booking berstatus
     * pending (lihat BookingController::store()) tidak pernah dilepas
     * otomatis kalau customer tidak lanjut bayar. Akibatnya stok itu
     * "hilang" dari inventaris selamanya walau sebenarnya tidak ada yang
     * benar-benar naik. Command ini menjalankan dua hal untuk tiap booking
     * pending yang bk_hold_until-nya sudah lewat:
     *
     * 1. Kembalikan (kurangi) seats_booked di availability_leg untuk semua
     *    etape yang dipakai penumpang booking itu.
     * 2. Tandai booking-nya jadi 'expired', supaya tidak menggantung
     *    selamanya di daftar booking dengan status pending.
     */
    protected $signature = 'bookings:release-expired-holds';

    protected $description = 'Kembalikan stok kursi dari booking pending yang sudah lewat batas waktu, lalu tandai expired.';

    public function handle(): int
    {
        $now = now();

        $bookingKedaluwarsa = Booking::with('passengers')
            ->where('bk_status', 'pending')
            ->whereNotNull('bk_hold_until')
            ->where('bk_hold_until', '<', $now)
            ->get();

        $jumlahBooking = 0;

        DB::transaction(function () use ($bookingKedaluwarsa, &$jumlahBooking) {
            foreach ($bookingKedaluwarsa as $booking) {
                // Hitung ulang etape mana aja yang dipakai penumpang booking
                // ini (bayi tidak ikut dihitung, sama seperti waktu booking
                // dibuat di BookingController::store()).
                $tambahanPerEtape = [];

                foreach ($booking->passengers as $passenger) {
                    if ($passenger->ps_category === 'infant') {
                        continue;
                    }

                    if (! $passenger->fromStop || ! $passenger->toStop) {
                        continue;
                    }

                    $etapeDilewati = \App\Services\RouteFareCalculator::legsBetween(
                        $passenger->fromStop,
                        $passenger->toStop,
                    );

                    foreach ($etapeDilewati as $etape) {
                        $tambahanPerEtape[$etape->route_stop_id] = ($tambahanPerEtape[$etape->route_stop_id] ?? 0) + 1;
                    }
                }

                foreach ($tambahanPerEtape as $routeStopId => $jumlah) {
                    AvailabilityLeg::where('availability_id', $booking->availability_id)
                        ->where('route_stop_id', $routeStopId)
                        ->decrement('seats_booked', $jumlah);
                }

                $booking->update(['bk_status' => 'expired']);
                $jumlahBooking++;
            }
        });

        $this->info("Booking ditandai expired & stoknya dikembalikan: {$jumlahBooking}.");

        return self::SUCCESS;
    }
}
