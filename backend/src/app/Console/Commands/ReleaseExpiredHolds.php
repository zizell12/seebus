<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingHoldExpiry;
use Illuminate\Console\Command;

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
        $bookingIds = Booking::query()
            ->where('bk_status', 'pending')
            ->where(function ($query) {
                $query->whereNull('bk_hold_until')
                    ->orWhere('bk_hold_until', '<=', now());
            })
            ->distinct()
            ->pluck('availability_id')
            ->all();
        $jumlahBooking = app(BookingHoldExpiry::class)->releaseExpiredForAvailabilityIds($bookingIds);

        $this->info("Booking ditandai expired & stoknya dikembalikan: {$jumlahBooking}.");

        return self::SUCCESS;
    }
}
