<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\RouteStop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminStopFareCorrectionTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_fare_correction_recalculates_current_and_future_availability_cache_only(): void
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::now($this->tz())->addDays(3),
        ]);
        $route = $booking->availability->route;
        $stop = $route->stops()->where('stop_order', 1)->firstOrFail();
        $today = Carbon::today($this->tz())->toDateString();
        $yesterday = Carbon::today($this->tz())->subDay()->toDateString();
        $todayAvailability = $this->availability($route->route_id, $booking->availability->bus_unit_id, $today);
        $yesterdayAvailability = $this->availability($route->route_id, $booking->availability->bus_unit_id, $yesterday);
        $bookingTotal = $booking->bk_total_price;
        Sanctum::actingAs($this->makeAdmin());

        $this->patchJson("/api/admin/route/{$route->route_id}/stops/{$stop->route_stop_id}/fare", [
            'fare_adult' => 90000,
            'fare_child' => 60000,
            'fare_infant' => 1000,
        ])->assertOk()->assertJsonPath('jadwal_diperbarui', 2)
            ->assertJsonPath('data.fare_adult', '90000.00');

        $this->assertEquals(90000, $stop->fresh()->fare_adult);
        $this->assertSame(['adult' => 90000, 'child' => 60000, 'infant' => 1000], $todayAvailability->fresh()->av_price);
        $this->assertSame(['adult' => 90000, 'child' => 60000, 'infant' => 1000], $booking->availability->fresh()->av_price);
        $this->assertSame(['adult' => 75000, 'child' => 50000, 'infant' => 0], $yesterdayAvailability->fresh()->av_price);
        $this->assertEquals($bookingTotal, $booking->fresh()->bk_total_price);
    }

    public function test_start_stop_fare_is_rejected_and_stop_structure_remains_locked(): void
    {
        $booking = $this->makeBooking();
        $route = $booking->availability->route;
        $stops = $route->stops;
        Sanctum::actingAs($this->makeAdmin());

        $this->patchJson("/api/admin/route/{$route->route_id}/stops/{$stops->first()->route_stop_id}/fare", [
            'fare_adult' => 0,
            'fare_child' => 0,
            'fare_infant' => 0,
        ])->assertUnprocessable();

        $this->postJson("/api/admin/route/{$route->route_id}/stops", [
            'station_id' => $route->destination_station_id,
            'stop_type' => 'both',
            'fare_adult' => 1,
            'fare_child' => 1,
            'fare_infant' => 0,
        ])->assertUnprocessable();

        $this->deleteJson("/api/admin/route/{$route->route_id}/stops/{$stops->last()->route_stop_id}")
            ->assertUnprocessable();
    }

    private function availability(int $routeId, int $busUnitId, string $date): Availability
    {
        return Availability::create([
            'route_id' => $routeId,
            'bus_unit_id' => $busUnitId,
            'av_date' => $date,
            'av_time' => '23:00:00',
            'av_price' => ['adult' => 75000, 'child' => 50000, 'infant' => 0],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
    }
}
