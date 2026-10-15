<?php

namespace App\Services;

use App\Models\AvailabilityLeg;
use App\Models\Booking;

class BookingStockReleaser
{
    public static function release(Booking $booking): void
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
