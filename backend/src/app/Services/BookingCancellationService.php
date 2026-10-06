<?php

namespace App\Services;

use App\Models\AvailabilityLeg;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingCancellationService
{
    public function cancel(Booking $booking, string $reason, int $cancelledBy): array
    {
        return DB::transaction(function () use ($booking, $reason, $cancelledBy) {
            $locked = Booking::whereKey($booking->booking_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($locked->bk_status, ['expired', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking sudah tidak dapat dibatalkan.',
                ])->status(422);
            }

            if ($locked->bk_status === 'pending') {
                $this->releaseSeats($locked);
                $locked->update([
                    'bk_status' => 'cancelled',
                    'bk_cancelled_at' => now(),
                    'bk_cancel_reason' => $reason,
                    'bk_cancelled_by' => $cancelledBy,
                ]);

                return [
                    'status' => 'cancelled',
                    'refund_required' => false,
                    'refund_percent' => 0,
                    'refund_amount' => 0,
                ];
            }

            throw ValidationException::withMessages([
                'booking_status' => 'Booking berstatus paid tidak boleh dibatalkan melalui service ini.',
            ])->status(422);
        });
    }

    public function releaseSeats(Booking $booking): void
    {
        $seatsByLeg = [];
        $booking->loadMissing(['passengers.fromStop', 'passengers.toStop']);

        foreach ($booking->passengers as $passenger) {
            if ($passenger->ps_category === 'infant') {
                continue;
            }

            if (! $passenger->fromStop || ! $passenger->toStop) {
                continue;
            }

            foreach (RouteFareCalculator::legsBetween($passenger->fromStop, $passenger->toStop) as $leg) {
                $seatsByLeg[$leg->route_stop_id] = ($seatsByLeg[$leg->route_stop_id] ?? 0) + 1;
            }
        }

        foreach ($seatsByLeg as $routeStopId => $seats) {
            AvailabilityLeg::where('availability_id', $booking->availability_id)
                ->where('route_stop_id', $routeStopId)
                ->decrement('seats_booked', $seats);
        }
    }
}
