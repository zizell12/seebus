<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\Passenger;

class SeatMap
{
    private const SEAT_COLUMNS = ['A', 'B', 'C', 'D'];

    public static function supportsNumberedSeats(Availability $availability): bool
    {
        $availability->loadMissing('busUnit.busType');

        return (bool) $availability->busUnit?->busType?->bt_use_seat_number;
    }

    public static function seatRows(int $capacity, ?string $pattern): array
    {
        $patternCounts = array_map('intval', explode('-', $pattern ?: '2-2'));
        $patternCounts = array_values(array_filter($patternCounts, fn ($count) => $count > 0));
        if ($patternCounts === []) {
            $patternCounts = [2, 2];
        }

        $rows = [];
        $seatsCreated = 0;
        for ($rowNumber = 1; $seatsCreated < $capacity; $rowNumber++) {
            $row = [];
            foreach ($patternCounts as $count) {
                for ($column = 0; $column < $count && $seatsCreated < $capacity; $column++) {
                    $seatColumn = count($row);
                    $letter = self::SEAT_COLUMNS[$seatColumn] ?? chr(ord('A') + $seatColumn);
                    $row[] = $rowNumber.$letter;
                    $seatsCreated++;
                }
            }
            $rows[] = $row;
        }

        return $rows;
    }

    public static function seatNumbers(int $capacity, ?string $pattern = null): array
    {
        return array_merge(...self::seatRows($capacity, $pattern));
    }

    public static function reservedSeatNumbers(
        Availability $availability,
        int $fromStopOrder,
        int $toStopOrder,
    ): array {
        return Passenger::query()
            ->whereNotNull('ps_seat_number')
            ->where('ps_category', '!=', 'infant')
            ->whereHas('booking', function ($query) use ($availability) {
                $query->where('availability_id', $availability->availability_id)
                    ->where(function ($statusQuery) {
                        $statusQuery->where('bk_status', 'paid')
                            ->orWhere(function ($pendingQuery) {
                                $pendingQuery->where('bk_status', 'pending')
                                    ->where('bk_hold_until', '>', now());
                            });
                    });
            })
            ->whereHas('fromStop', fn ($query) => $query->where('stop_order', '<', $toStopOrder))
            ->whereHas('toStop', fn ($query) => $query->where('stop_order', '>', $fromStopOrder))
            ->pluck('ps_seat_number')
            ->map(fn ($seatNumber) => mb_strtoupper($seatNumber))
            ->unique()
            ->values()
            ->all();
    }
}
