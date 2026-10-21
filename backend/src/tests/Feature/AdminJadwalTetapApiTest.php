<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BusUnit;
use App\Models\Route;
use App\Models\ScheduleTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminJadwalTetapApiTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_template_endpoints_are_restricted_to_admins(): void
    {
        $this->getJson('/api/admin/jadwal-tetap')->assertUnauthorized();

        Sanctum::actingAs(User::create([
            'usr_name' => 'Pengguna Uji',
            'usr_email' => 'pengguna-jadwal@example.com',
            'usr_password_hash' => bcrypt('secret-uji'),
            'usr_role' => 'customer',
        ]));
        $this->getJson('/api/admin/jadwal-tetap')->assertForbidden();
    }

    public function test_admin_can_list_create_update_and_toggle_templates(): void
    {
        [$route, $busUnit] = $this->routeAndBus();
        Sanctum::actingAs($this->makeAdmin());

        $response = $this->postJson('/api/admin/jadwal-tetap', $this->payload($route, $busUnit));
        $response->assertCreated()
            ->assertJsonPath('data.label_rute', 'terminal jember - terminal surabaya')
            ->assertJsonPath('data.armada', $busUnit->bu_code)
            ->assertJsonPath('data.departure_time', '08:30')
            ->assertJsonPath('data.days_of_week', [1, 3])
            ->assertJsonPath('data.is_active', true);

        $templateId = $response->json('data.schedule_template_id');
        $this->getJson('/api/admin/jadwal-tetap')
            ->assertOk()
            ->assertJsonPath('data.0.schedule_template_id', $templateId);

        $this->putJson('/api/admin/jadwal-tetap/'.$templateId, $this->payload($route, $busUnit, '09:30'))
            ->assertOk()
            ->assertJsonPath('data.departure_time', '09:30');

        $this->patchJson('/api/admin/jadwal-tetap/'.$templateId.'/status')
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_template_validation_rejects_invalid_route_bus_time_and_days(): void
    {
        [$route, $busUnit] = $this->routeAndBus();
        Sanctum::actingAs($this->makeAdmin());
        $payload = $this->payload($route, $busUnit);

        $this->postJson('/api/admin/jadwal-tetap', array_merge($payload, [
            'departure_time' => '8:30',
        ]))->assertUnprocessable()->assertJsonValidationErrors('departure_time');

        $this->postJson('/api/admin/jadwal-tetap', array_merge($payload, [
            'days_of_week' => [1, 1],
        ]))->assertUnprocessable()->assertJsonValidationErrors('days_of_week.1');

        $this->postJson('/api/admin/jadwal-tetap', array_merge($payload, [
            'days_of_week' => [7],
        ]))->assertUnprocessable()->assertJsonValidationErrors('days_of_week.0');

        $busUnit->update(['is_active' => false]);
        $this->postJson('/api/admin/jadwal-tetap', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bus_unit_id');
    }

    public function test_template_requires_at_least_two_route_stops(): void
    {
        [$route, $busUnit] = $this->routeAndBus();
        $incompleteRoute = Route::create([
            'origin_station_id' => $route->origin_station_id,
            'destination_station_id' => $route->destination_station_id,
            'rt_distance_km' => 200,
            'rt_duration_min' => 300,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson('/api/admin/jadwal-tetap', $this->payload($incompleteRoute, $busUnit))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('route_id');
    }

    public function test_duplicate_template_is_rejected(): void
    {
        [$route, $busUnit] = $this->routeAndBus();
        Sanctum::actingAs($this->makeAdmin());
        $payload = $this->payload($route, $busUnit);

        $this->postJson('/api/admin/jadwal-tetap', $payload)->assertCreated();
        $this->postJson('/api/admin/jadwal-tetap', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('departure_time');
    }

    public function test_deleting_template_does_not_delete_existing_availability(): void
    {
        [$route, $busUnit] = $this->routeAndBus();
        $template = $this->createTemplate($route, $busUnit);
        $availability = Availability::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'av_date' => '2027-05-01',
            'av_time' => '08:30:00',
            'av_price' => ['adult' => 75000],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->deleteJson('/api/admin/jadwal-tetap/'.$template->schedule_template_id)
            ->assertOk();

        $this->assertDatabaseMissing('schedule_template', ['schedule_template_id' => $template->schedule_template_id]);
        $this->assertDatabaseHas('availability', ['availability_id' => $availability->availability_id]);
    }

    public function test_generate_endpoint_returns_generator_counts(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 07:00:00', $this->tz()));
        try {
            [$route, $busUnit] = $this->routeAndBus();
            $template = $this->createTemplate($route, $busUnit, [0]);
            Sanctum::actingAs($this->makeAdmin());

            $this->postJson('/api/admin/jadwal-tetap/generate', [
                'hari' => 1,
                'template_id' => $template->schedule_template_id,
            ])->assertOk()
                ->assertJsonPath('dibuat', 1)
                ->assertJsonPath('sudah_ada', 0)
                ->assertJsonPath('lewat_waktu', 0)
                ->assertJsonPath('bentrok', 0)
                ->assertJsonPath('template_dilewati', 0);
        } finally {
            Carbon::setTestNow();
        }
    }

    private function routeAndBus(): array
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::parse('2027-04-01 08:00:00', $this->tz()),
        ]);

        return [$booking->availability->route, $booking->availability->busUnit];
    }

    private function payload(Route $route, BusUnit $busUnit, string $time = '08:30'): array
    {
        return [
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'departure_time' => $time,
            'days_of_week' => [1, 3],
            'is_active' => true,
        ];
    }

    private function createTemplate(Route $route, BusUnit $busUnit, array $days = [0]): ScheduleTemplate
    {
        return ScheduleTemplate::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'departure_time' => '08:30:00',
            'days_of_week' => $days,
            'is_active' => true,
        ]);
    }
}
