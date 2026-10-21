<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BusUnit;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\ScheduleTemplate;
use App\Services\JadwalTetapGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class JadwalTetapGeneratorTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_generator_creates_only_on_selected_days(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit] = $this->routeAndBus();
            $this->makeTemplate($route, $busUnit, [1], '08:30:00');

            $result = app(JadwalTetapGenerator::class)->generate(3);

            $this->assertSame(1, $result['dibuat']);
            $this->assertTrue(Availability::query()
                ->where('route_id', $route->route_id)
                ->where('bus_unit_id', $busUnit->bus_unit_id)
                ->whereDate('av_date', '2026-11-02')
                ->where('av_time', '08:30:00')
                ->exists());
            $this->assertFalse(Availability::query()
                ->where('route_id', $route->route_id)
                ->where('bus_unit_id', $busUnit->bus_unit_id)
                ->whereDate('av_date', '2026-11-01')
                ->where('av_time', '08:30:00')
                ->exists());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_generator_is_idempotent(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit] = $this->routeAndBus();
            $this->makeTemplate($route, $busUnit, [1], '08:30:00');
            $generator = app(JadwalTetapGenerator::class);

            $first = $generator->generate(2);
            $second = $generator->generate(2);

            $this->assertSame(1, $first['dibuat']);
            $this->assertSame(0, $second['dibuat']);
            $this->assertSame(1, $second['sudah_ada']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_inactive_template_bus_and_route_without_two_stops_are_not_generated(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit, $stationA, $stationB] = $this->routeAndBus();
            $this->makeTemplate($route, $busUnit, [0], '08:30:00', false);

            $inactiveBus = BusUnit::create([
                'bus_type_id' => $busUnit->bus_type_id,
                'bu_code' => 'bus-nonaktif-uji',
                'bu_capacity' => 32,
                'is_active' => false,
            ]);
            $this->makeTemplate($route, $inactiveBus, [0], '09:30:00');

            $incompleteRoute = Route::create([
                'origin_station_id' => $stationA->station_id,
                'destination_station_id' => $stationB->station_id,
                'rt_distance_km' => 200,
                'rt_duration_min' => 300,
            ]);
            $this->makeTemplate($incompleteRoute, $busUnit, [0], '10:30:00');

            $result = app(JadwalTetapGenerator::class)->generate(1);

            $this->assertSame(0, $result['dibuat']);
            $this->assertSame(2, $result['template_dilewati']);
            $this->assertDatabaseMissing('availability', [
                'route_id' => $route->route_id,
                'bus_unit_id' => $busUnit->bus_unit_id,
                'av_date' => '2026-11-01',
                'av_time' => '08:30:00',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_departure_time_already_passed_today_is_skipped(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 09:00:00', $this->tz()));
        try {
            [$route, $busUnit] = $this->routeAndBus();
            $this->makeTemplate($route, $busUnit, [0], '08:30:00');

            $result = app(JadwalTetapGenerator::class)->generate(1);

            $this->assertSame(1, $result['lewat_waktu']);
            $this->assertSame(0, $result['dibuat']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_conflicting_departure_is_skipped_and_counted(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit, $stationA, $stationB] = $this->routeAndBus();
            $conflictingRoute = Route::create([
                'origin_station_id' => $stationA->station_id,
                'destination_station_id' => $stationB->station_id,
                'rt_distance_km' => 200,
                'rt_duration_min' => 300,
            ]);
            RouteStop::create([
                'route_id' => $conflictingRoute->route_id,
                'station_id' => $stationA->station_id,
                'stop_order' => 0,
            ]);
            RouteStop::create([
                'route_id' => $conflictingRoute->route_id,
                'station_id' => $stationB->station_id,
                'stop_order' => 1,
                'offset_minutes' => 300,
                'fare_adult' => 75000,
                'fare_child' => 50000,
                'fare_infant' => 0,
            ]);

            Availability::create([
                'route_id' => $route->route_id,
                'bus_unit_id' => $busUnit->bus_unit_id,
                'av_date' => '2026-11-01',
                'av_time' => '10:00:00',
                'av_price' => ['adult' => 75000],
                'av_status' => 'active',
                'av_seats' => 32,
            ]);
            $this->makeTemplate($conflictingRoute, $busUnit, [0], '13:00:00');

            $result = app(JadwalTetapGenerator::class)->generate(1);

            $this->assertSame(1, $result['bentrok']);
            $this->assertSame(0, $result['dibuat']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_artisan_command_runs_and_prints_result_summary(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit] = $this->routeAndBus();
            $this->makeTemplate($route, $busUnit, [0], '08:30:00');

            $this->artisan('jadwal:generate-tetap', ['--hari' => 1])
                ->expectsOutputToContain('Jadwal tetap: dibuat 1')
                ->assertSuccessful();
        } finally {
            Carbon::setTestNow();
        }
    }

    private function routeAndBus(): array
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::parse('2027-04-01 08:00:00', $this->tz()),
        ]);
        $route = $booking->availability->route;

        return [
            $route,
            $booking->availability->busUnit,
            $route->originStation,
            $route->destinationStation,
        ];
    }

    private function makeTemplate(Route $route, BusUnit $busUnit, array $days, string $time, bool $active = true): ScheduleTemplate
    {
        return ScheduleTemplate::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'departure_time' => $time,
            'days_of_week' => $days,
            'is_active' => $active,
        ]);
    }
}
