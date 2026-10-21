<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BusUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class JadwalSearchInactiveUnitTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_public_search_hides_inactive_bus_units_but_keeps_active_units(): void
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::now($this->tz())->addDays(5),
        ]);
        $activeAvailability = $booking->availability;
        $booking->availability->route->originStation->region->update(['rg_city' => 'jember']);
        $booking->availability->route->destinationStation->region->update(['rg_city' => 'surabaya']);
        $inactiveBus = BusUnit::create([
            'bus_type_id' => $activeAvailability->busUnit->bus_type_id,
            'bu_code' => 'unit-nonaktif-uji',
            'bu_capacity' => 32,
            'is_active' => false,
        ]);
        Availability::create([
            'route_id' => $activeAvailability->route_id,
            'bus_unit_id' => $inactiveBus->bus_unit_id,
            'av_date' => $activeAvailability->av_date->toDateString(),
            'av_time' => '15:00:00',
            'av_price' => $activeAvailability->av_price,
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        $response = $this->getJson('/api/jadwal?'.http_build_query([
            'dari' => 'Jember',
            'tujuan' => 'Surabaya',
            'tanggal' => $activeAvailability->av_date->toDateString(),
        ]))->assertOk();

        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.availability_id', $activeAvailability->availability_id);
    }
}
