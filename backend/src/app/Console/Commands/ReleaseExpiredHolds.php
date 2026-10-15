<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingStockReleaser;
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

        $bookingIds = Booking::query()
            ->where('bk_status', 'pending')
            ->whereNotNull('bk_hold_until')
            ->where('bk_hold_until', '<', $now)
            ->pluck('booking_id');

        $jumlahBooking = 0;

        foreach ($bookingIds as $bookingId) {
            DB::transaction(function () use ($bookingId, $now, &$jumlahBooking) {
                $booking = Booking::with('passengers.fromStop', 'passengers.toStop')
                    ->whereKey($bookingId)
                    ->lockForUpdate()
                    ->first();

                if (! $booking || $booking->bk_status !== 'pending' || ! $booking->bk_hold_until || $booking->bk_hold_until->greaterThanOrEqualTo($now)) {
                    return;
                }

                BookingStockReleaser::release($booking);
                $booking->update(['bk_status' => 'expired']);
                $jumlahBooking++;
            });
        }

        $this->info("Booking ditandai expired & stoknya dikembalikan: {$jumlahBooking}.");

        return self::SUCCESS;
    }
}
