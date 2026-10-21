<?php

namespace Tests\Feature;

use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminRouteLockTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_route_endpoints_are_locked_after_availability_exists(): void
    {
        $booking = $this->makeBooking();
        $route = $booking->availability->route;
        $station = Station::create([
            'region_id' => $route->originStation->region_id,
            'stn_name' => 'terminal alternatif',
            'stn_address' => 'Jl. Alternatif',
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->putJson("/api/admin/route/{$route->route_id}", $this->payload($route, [
            'origin_station_id' => $station->station_id,
        ]))->assertUnprocessable()
            ->assertJsonPath('message', 'Asal dan tujuan rute tidak dapat diubah karena rute ini sudah punya jadwal.');

        $this->putJson("/api/admin/route/{$route->route_id}", $this->payload($route, [
            'destination_station_id' => $station->station_id,
        ]))->assertUnprocessable()
            ->assertJsonPath('message', 'Asal dan tujuan rute tidak dapat diubah karena rute ini sudah punya jadwal.');
    }

    public function test_distance_and_duration_can_change_and_unchanged_endpoints_pass(): void
    {
        $booking = $this->makeBooking();
        $route = $booking->availability->route;
        Sanctum::actingAs($this->makeAdmin());

        $this->putJson("/api/admin/route/{$route->route_id}", $this->payload($route, [
            'rt_distance_km' => 250,
            'rt_duration_min' => 360,
        ]))->assertOk()
            ->assertJsonPath('data.rt_distance_km', 250)
            ->assertJsonPath('data.rt_duration_min', 360);
    }

    private function payload($route, array $overrides = []): array
    {
        return array_merge([
            'origin_station_id' => $route->origin_station_id,
            'destination_station_id' => $route->destination_station_id,
            'rt_distance_km' => $route->rt_distance_km,
            'rt_duration_min' => $route->rt_duration_min,
        ], $overrides);
    }
}
