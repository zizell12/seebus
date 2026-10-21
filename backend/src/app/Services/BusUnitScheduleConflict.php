<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\Route;
use Illuminate\Support\Carbon;

class BusUnitScheduleConflict
{
    private const BUFFER_MINUTES = 60;

    public static function conflicts(
        int $busUnitId,
        string $date,
        string $time,
        ?int $ignoreAvailabilityId = null,
        ?int $routeId = null,
    ): bool {
        $timezone = config('app.timezone');
        $newStart = Carbon::parse("{$date} {$time}", $timezone);
        $newDuration = $routeId === null
            ? 0
            : (int) (Route::whereKey($routeId)->value('rt_duration_min') ?? 0);
        $newEnd = $newStart->copy()->addMinutes($newDuration + self::BUFFER_MINUTES);
        $rangeStart = Carbon::parse($date, $timezone)->subDay()->toDateString();
        $rangeEnd = Carbon::parse($date, $timezone)->addDay()->toDateString();

        $availabilities = Availability::query()
            ->with('route')
            ->where('bus_unit_id', $busUnitId)
            ->where('av_status', 'active')
            ->whereDate('av_date', '>=', $rangeStart)
            ->whereDate('av_date', '<=', $rangeEnd)
            ->when($ignoreAvailabilityId !== null, fn ($query) => $query->where('availability_id', '!=', $ignoreAvailabilityId))
            ->get();

        foreach ($availabilities as $availability) {
            $existingStart = Carbon::parse(
                $availability->av_date->toDateString().' '.$availability->av_time,
                $timezone,
            );
            $existingDuration = (int) ($availability->route?->rt_duration_min ?? 0);
            $existingEnd = $existingStart->copy()->addMinutes($existingDuration + self::BUFFER_MINUTES);

            if ($newStart->lt($existingEnd) && $existingStart->lt($newEnd)) {
                return true;
            }
        }

        return false;
    }
}
