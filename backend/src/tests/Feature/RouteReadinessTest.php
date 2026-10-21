<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Models\RouteStop;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class RouteReadinessTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_stops_problems_detects_missing_endpoints_and_adjacent_duplicates(): void
    {
        $booking = $this->makeBooking();
        $baseRoute = $booking->availability->route;
        $stationC = Station::create([
            'region_id' => $baseRoute->originStation->region_id,
            'stn_name' => 'terminal tambahan',
            'stn_address' => 'Jl. C',
        ]);

        $tooFew = Route::create([
            'origin_station_id' => $baseRoute->origin_station_id,
            'destination_station_id' => $stationC->station_id,
        ]);
        $this->assertContains('Rute harus memiliki minimal 2 titik pemberhentian.', $tooFew->stopsProblems());

        $wrongOrigin = Route::create([
            'origin_station_id' => $baseRoute->origin_station_id,
            'destination_station_id' => $stationC->station_id,
        ]);
        RouteStop::create(['route_id' => $wrongOrigin->route_id, 'station_id' => $stationC->station_id, 'stop_order' => 0]);
        RouteStop::create(['route_id' => $wrongOrigin->route_id, 'station_id' => $stationC->station_id, 'stop_order' => 1]);
        $this->assertContains('Titik pemberhentian pertama harus sama dengan asal rute.', $wrongOrigin->stopsProblems());
        $this->assertContains('Dua titik pemberhentian berurutan tidak boleh menggunakan stasiun yang sama.', $wrongOrigin->stopsProblems());

        $wrongDestination = Route::create([
            'origin_station_id' => $baseRoute->origin_station_id,
            'destination_station_id' => $stationC->station_id,
        ]);
        RouteStop::create(['route_id' => $wrongDestination->route_id, 'station_id' => $baseRoute->origin_station_id, 'stop_order' => 0]);
        RouteStop::create(['route_id' => $wrongDestination->route_id, 'station_id' => $baseRoute->origin_station_id, 'stop_order' => 1]);
        $this->assertContains('Titik pemberhentian terakhir harus sama dengan tujuan rute.', $wrongDestination->stopsProblems());
    }

    public function test_complete_route_is_ready_for_schedule(): void
    {
        $booking = $this->makeBooking();
        $route = $booking->availability->route;

        $this->assertSame([], $route->stopsProblems());
        $this->assertTrue($route->isReadyForSchedule());
    }

    public function test_options_explain_route_readiness_and_store_rejects_unready_route(): void
    {
        $booking = $this->makeBooking();
        $route = $booking->availability->route;
        $stationC = Station::create([
            'region_id' => $route->originStation->region_id,
            'stn_name' => 'terminal tidak sesuai',
            'stn_address' => 'Jl. C',
        ]);
        $route->stops()->where('stop_order', 1)->update(['station_id' => $stationC->station_id]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/jadwal-options')
            ->assertOk()
            ->assertJsonPath('routes.0.siap_dipakai', false)
            ->assertJsonPath('routes.0.masalah.0', 'Titik pemberhentian terakhir harus sama dengan tujuan rute.');

        $this->postJson('/api/admin/jadwal', [
            'route_id' => $route->route_id,
            'bus_unit_id' => $booking->availability->bus_unit_id,
            'av_date' => Carbon::now($this->tz())->addDays(10)->toDateString(),
            'av_time' => '08:30',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Titik pemberhentian terakhir harus sama dengan tujuan rute.');
    }
}
