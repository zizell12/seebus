<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BusUnit;
use App\Services\BusUnitScheduleConflict;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BusUnitScheduleConflictTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_overlapping_departures_for_one_bus_unit_conflict(): void
    {
        [$route, $busUnit, $date] = $this->scheduleFixture();
        $this->createAvailability($route->route_id, $busUnit->bus_unit_id, $date, '10:00:00');

        $this->assertTrue(BusUnitScheduleConflict::conflicts(
            $busUnit->bus_unit_id,
            $date,
            '13:59:00',
            routeId: $route->route_id,
        ));
    }

    public function test_departures_more_than_duration_and_buffer_apart_do_not_conflict(): void
    {
        [$route, $busUnit, $date] = $this->scheduleFixture();
        $this->createAvailability($route->route_id, $busUnit->bus_unit_id, $date, '10:00:00');

        $this->assertFalse(BusUnitScheduleConflict::conflicts(
            $busUnit->bus_unit_id,
            $date,
            '16:01:00',
            routeId: $route->route_id,
        ));
    }

    public function test_overnight_trip_conflicts_with_next_day_departure(): void
    {
        [$route, $busUnit, $date] = $this->scheduleFixture();
        $nextDate = Carbon::parse($date, $this->tz())->addDay()->toDateString();
        $this->createAvailability($route->route_id, $busUnit->bus_unit_id, $nextDate, '01:00:00');

        $this->assertTrue(BusUnitScheduleConflict::conflicts(
            $busUnit->bus_unit_id,
            $date,
            '23:00:00',
            routeId: $route->route_id,
        ));
    }

    public function test_ignore_availability_id_excludes_the_matching_schedule(): void
    {
        [$route, $busUnit, $date] = $this->scheduleFixture();
        $availability = $this->createAvailability($route->route_id, $busUnit->bus_unit_id, $date, '10:00:00');

        $this->assertFalse(BusUnitScheduleConflict::conflicts(
            $busUnit->bus_unit_id,
            $date,
            '10:00:00',
            $availability->availability_id,
            $route->route_id,
        ));
    }

    public function test_inactive_schedules_and_schedules_for_other_bus_units_are_ignored(): void
    {
        [$route, $busUnit, $date] = $this->scheduleFixture();
        $inactive = $this->createAvailability($route->route_id, $busUnit->bus_unit_id, $date, '10:00:00', 'inactive');
        $otherBusUnit = BusUnit::create([
            'bus_type_id' => $busUnit->bus_type_id,
            'bu_code' => 'bus-lain-uji',
            'bu_capacity' => 32,
            'is_active' => true,
        ]);
        $other = $this->createAvailability($route->route_id, $otherBusUnit->bus_unit_id, $date, '10:00:00');

        $this->assertFalse(BusUnitScheduleConflict::conflicts(
            $busUnit->bus_unit_id,
            $date,
            '10:00:00',
            routeId: $route->route_id,
        ));

        $inactive->delete();
        $other->delete();
    }

    private function scheduleFixture(): array
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::now($this->tz())->addDays(120),
        ]);

        return [
            $booking->availability->route,
            $booking->availability->busUnit,
            Carbon::now($this->tz())->addDays(10)->toDateString(),
        ];
    }

    private function createAvailability(
        int $routeId,
        int $busUnitId,
        string $date,
        string $time,
        string $status = 'active',
    ): Availability {
        return Availability::create([
            'route_id' => $routeId,
            'bus_unit_id' => $busUnitId,
            'av_date' => $date,
            'av_time' => $time,
            'av_price' => ['adult' => 75000],
            'av_status' => $status,
            'av_seats' => 32,
        ]);
    }
}
