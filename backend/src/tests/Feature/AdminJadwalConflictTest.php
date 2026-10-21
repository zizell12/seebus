<?php

namespace Tests\Feature;

use App\Models\Availability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminJadwalConflictTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_store_rejects_and_generate_skips_overlapping_departure(): void
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::now($this->tz())->addDays(120),
        ]);
        $route = $booking->availability->route;
        $busUnit = $booking->availability->busUnit;
        $date = Carbon::now($this->tz())->addDays(10);
        $departure = $date->copy()->setTime(10, 0);
        Availability::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'av_date' => $departure->toDateString(),
            'av_time' => '10:00:00',
            'av_price' => ['adult' => 75000],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson('/api/admin/jadwal', [
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'av_date' => $departure->toDateString(),
            'av_time' => '13:00',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Armada ini sudah dijadwalkan di keberangkatan lain pada waktu yang berimpit.');

        $this->postJson('/api/admin/jadwal/generate', [
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'tanggal_mulai' => $departure->toDateString(),
            'tanggal_selesai' => $departure->toDateString(),
            'hari' => [(int) $departure->dayOfWeek],
            'jam' => ['13:00'],
        ])->assertCreated()
            ->assertJsonPath('dibuat', 0)
            ->assertJsonPath('dilewati', 0)
            ->assertJsonPath('bentrok', 1)
            ->assertJsonPath('message', 'Berhasil generate 0 jadwal baru; 0 dilewati karena sudah ada dan 1 dilewati karena bentrok.');
    }
}
