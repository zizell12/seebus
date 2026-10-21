<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Models\RouteStop;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminRouteStopConsistencyTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_first_stop_must_match_route_origin_and_duplicate_adjacent_station_is_rejected(): void
    {
        $booking = $this->makeBooking();
        $existingRoute = $booking->availability->route;
        $route = Route::create([
            'origin_station_id' => $existingRoute->destination_station_id,
            'destination_station_id' => $existingRoute->origin_station_id,
            'rt_distance_km' => 200,
            'rt_duration_min' => 300,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson("/api/admin/route/{$route->route_id}/stops", [
            'station_id' => $existingRoute->origin_station_id,
            'stop_type' => 'both',
        ])->assertUnprocessable()->assertJsonValidationErrors('station_id');

        $this->postJson("/api/admin/route/{$route->route_id}/stops", [
            'station_id' => $route->origin_station_id,
            'stop_type' => 'both',
        ])->assertCreated();

        $this->postJson("/api/admin/route/{$route->route_id}/stops", [
            'station_id' => $route->origin_station_id,
            'stop_type' => 'both',
            'fare_adult' => 50000,
            'fare_child' => 30000,
            'fare_infant' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('station_id');
    }

    public function test_index_includes_readiness_problem_fields(): void
    {
        $booking = $this->makeBooking();
        $baseRoute = $booking->availability->route;
        $route = Route::create([
            'origin_station_id' => $baseRoute->destination_station_id,
            'destination_station_id' => $baseRoute->origin_station_id,
        ]);
        RouteStop::create([
            'route_id' => $route->route_id,
            'station_id' => $route->origin_station_id,
            'stop_order' => 0,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson("/api/admin/route/{$route->route_id}/stops")
            ->assertOk()
            ->assertJsonPath('siap_dipakai', false)
            ->assertJsonPath('masalah.0', 'Rute harus memiliki minimal 2 titik pemberhentian.')
            ->assertJsonPath('sudah_punya_jadwal', false);
    }

    public function test_update_rejects_a_wrong_origin_and_adjacent_duplicate_station(): void
    {
        $booking = $this->makeBooking();
        $baseRoute = $booking->availability->route;
        $route = Route::create([
            'origin_station_id' => $baseRoute->destination_station_id,
            'destination_station_id' => $baseRoute->origin_station_id,
        ]);
        $first = RouteStop::create([
            'route_id' => $route->route_id,
            'station_id' => $route->origin_station_id,
            'stop_order' => 0,
        ]);
        $last = RouteStop::create([
            'route_id' => $route->route_id,
            'station_id' => $route->destination_station_id,
            'stop_order' => 1,
            'fare_adult' => 50000,
            'fare_child' => 30000,
            'fare_infant' => 0,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->putJson("/api/admin/route/{$route->route_id}/stops/{$first->route_stop_id}", [
            'station_id' => $route->destination_station_id,
            'stop_type' => 'both',
        ])->assertUnprocessable()->assertJsonValidationErrors('station_id');

        $this->putJson("/api/admin/route/{$route->route_id}/stops/{$last->route_stop_id}", [
            'station_id' => $route->origin_station_id,
            'stop_type' => 'both',
            'fare_adult' => 50000,
            'fare_child' => 30000,
            'fare_infant' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('station_id');
    }
}
