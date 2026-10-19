<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\DB;

class BookingHoldExpiry
{
    public function releaseExpiredForAvailabilityIds(array $availabilityIds): int
    {
        if ($availabilityIds === []) {
            return 0;
        }

        $now = now();
        $bookingIds = Booking::query()
            ->whereIn('availability_id', $availabilityIds)
            ->where('bk_status', 'pending')
            ->where(function ($query) use ($now) {
                $query->whereNull('bk_hold_until')
                    ->orWhere('bk_hold_until', '<=', $now);
            })
            ->pluck('booking_id');

        $released = 0;
        foreach ($bookingIds as $bookingId) {
            DB::transaction(function () use ($bookingId, $now, &$released) {
                $booking = Booking::with('passengers.fromStop', 'passengers.toStop')
                    ->whereKey($bookingId)
                    ->lockForUpdate()
                    ->first();

                if (
                    ! $booking
                    || $booking->bk_status !== 'pending'
                    || ($booking->bk_hold_until && $booking->bk_hold_until->isAfter($now))
                ) {
                    return;
                }

                BookingStockReleaser::release($booking);
                $booking->update(['bk_status' => 'expired']);
                $released++;
            });
        }

        return $released;
    }
}
