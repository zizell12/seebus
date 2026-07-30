<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Seat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReleaseExpiredHolds extends Command
{
    /**
     * php artisan bookings:release-expired-holds
     *
     * Tanpa command ini, kursi yang di-lock sementara (status 'locked', lihat
     * BookingController::store() dan KursiController::lock()) tidak pernah
     * dilepas otomatis kalau customer tidak lanjut bayar. Akibatnya kursi itu
     * "hilang" dari inventaris selamanya. Command ini menjalankan dua hal:
     *
     * 1. Kursi 'locked' yang seat_locked_until sudah lewat -> dikembalikan
     *    jadi 'empty'.
     * 2. Booking yang masih 'pending' tapi jadwal lock-nya (dari kursi terkait)
     *    sudah lewat semua -> ditandai 'expired', supaya tidak menggantung
     *    selamanya di daftar booking dengan status pending.
     */
    protected $signature = 'bookings:release-expired-holds';

    protected $description = 'Lepas kursi yang lock sementaranya sudah kedaluwarsa dan tandai booking pending yang ditinggalkan sebagai expired.';

    public function handle(): int
    {
        $now = now();

        $bookingIdsTerdampak = Booking::where('bk_status', 'pending')
            ->whereHas('passengers.seat', function ($q) use ($now) {
                $q->where('seat_status', 'locked')
                    ->where('seat_locked_until', '<', $now);
            })
            ->pluck('booking_id');

        $jumlahKursi = DB::transaction(function () use ($now) {
            return Seat::where('seat_status', 'locked')
                ->where('seat_locked_until', '<', $now)
                ->update([
                    'seat_status' => 'empty',
                    'seat_locked_session' => null,
                    'seat_locked_until' => null,
                ]);
        });

        $jumlahBooking = 0;
        if ($bookingIdsTerdampak->isNotEmpty()) {
            $jumlahBooking = Booking::whereIn('booking_id', $bookingIdsTerdampak)
                ->where('bk_status', 'pending')
                ->update(['bk_status' => 'expired']);
        }

        $this->info("Kursi dilepas: {$jumlahKursi}. Booking ditandai expired: {$jumlahBooking}.");

        return self::SUCCESS;
    }
}
