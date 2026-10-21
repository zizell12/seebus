<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\ScheduleTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminPersiapanTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-10-20 12:00:00', $this->tz()));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_endpoint_is_admin_only(): void
    {
        $this->getJson('/api/admin/persiapan')->assertUnauthorized();
        Sanctum::actingAs(\App\Models\User::create([
            'usr_name' => 'Pelanggan',
            'usr_email' => 'customer-persiapan@example.com',
            'usr_password_hash' => bcrypt('secret'),
            'usr_role' => 'customer',
        ]));
        $this->getJson('/api/admin/persiapan')->assertForbidden();
    }

    public function test_empty_database_returns_all_items_empty_and_not_ready(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $response = $this->getJson('/api/admin/persiapan')->assertOk();
        $response->assertJsonPath('siap_jual', false)
            ->assertJsonCount(7, 'data');
        foreach ($response->json('data') as $item) {
            if ($item['kunci'] === 'jadwal_tetap') {
                $this->assertSame('peringatan', $item['status']);
            } else {
                $this->assertSame('kosong', $item['status']);
            }
        }
    }

    public function test_route_with_one_stop_is_reported_with_its_problem(): void
    {
        $booking = $this->makeBooking();
        $baseRoute = $booking->availability->route;
        $route = Route::create([
            'origin_station_id' => $baseRoute->origin_station_id,
            'destination_station_id' => $baseRoute->destination_station_id,
        ]);
        RouteStop::create([
            'route_id' => $route->route_id,
            'station_id' => $route->origin_station_id,
            'stop_order' => 0,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/persiapan')->assertOk()
            ->assertJsonPath('data.2.status', 'peringatan')
            ->assertJsonPath('data.2.detail.0.route_id', $route->route_id)
            ->assertJsonPath('data.2.detail.0.masalah.0', 'Rute harus memiliki minimal 2 titik pemberhentian.');
    }

    public function test_complete_data_is_ready_and_template_is_optional(): void
    {
        $booking = $this->makeBooking();
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/persiapan')->assertOk()
            ->assertJsonPath('siap_jual', true)
            ->assertJsonPath('data.2.status', 'ok')
            ->assertJsonPath('data.6.status', 'peringatan');

        ScheduleTemplate::create([
            'route_id' => $booking->availability->route_id,
            'bus_unit_id' => $booking->availability->bus_unit_id,
            'departure_time' => '08:30:00',
            'days_of_week' => [1, 2],
            'is_active' => true,
        ]);
        $this->getJson('/api/admin/persiapan')->assertOk()
            ->assertJsonPath('siap_jual', true)
            ->assertJsonPath('data.6.status', 'ok');
    }

    public function test_active_schedules_eight_days_ahead_are_not_counted(): void
    {
        $booking = $this->makeBooking();
        $availability = $booking->availability;
        Availability::create([
            'route_id' => $availability->route_id,
            'bus_unit_id' => $availability->bus_unit_id,
            'av_date' => Carbon::today($this->tz())->addDays(8)->toDateString(),
            'av_time' => '10:00:00',
            'av_price' => ['adult' => 75000],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/persiapan')->assertOk()
            ->assertJsonPath('data.5.ringkasan', '1 jadwal aktif dalam 7 hari ke depan.');
    }
}
