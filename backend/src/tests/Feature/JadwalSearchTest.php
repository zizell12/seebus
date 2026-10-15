<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\AvailabilityLeg;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class JadwalSearchTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_pencarian_hari_ini_hanya_menampilkan_jadwal_yang_belum_berangkat(): void
    {
        config(['app.timezone' => 'Asia/Jakarta']);
        Carbon::setTestNow(Carbon::parse('2026-10-20 10:00:00', 'Asia/Jakarta'));

        $baseBooking = $this->makeBooking([
            'departure' => Carbon::parse('2026-10-20 06:00:00', 'Asia/Jakarta'),
        ]);
        $baseAvailability = $baseBooking->availability;
        DB::table('availability')
            ->where('availability_id', $baseAvailability->availability_id)
            ->update(['av_date' => '2026-10-20']);
        $regionAsal = $baseAvailability->route->originStation->region;
        $regionTujuan = $baseAvailability->route->destinationStation->region;
        $regionAsal->update(['rg_city' => 'jember']);
        $regionTujuan->update(['rg_city' => 'surabaya']);

        $hariIniSore = $this->makeAvailability($baseAvailability, '2026-10-20', '14:00:00');
        $besokPagi = $this->makeAvailability($baseAvailability, '2026-10-21', '06:00:00');
        $besokSore = $this->makeAvailability($baseAvailability, '2026-10-21', '14:00:00');

        $this->getJson('/api/jadwal?dari=jember&tujuan=surabaya&tanggal=2026-10-20')
            ->assertOk()
            ->assertJsonPath('data.0.availability_id', $hariIniSore->availability_id)
            ->assertJsonPath('data.0.jam_berangkat', '14:00')
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/jadwal?dari=jember&tujuan=surabaya&tanggal=2026-10-21')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.availability_id', $besokPagi->availability_id)
            ->assertJsonPath('data.1.availability_id', $besokSore->availability_id);
    }

    private function makeAvailability(Availability $template, string $date, string $time): Availability
    {
        $availability = Availability::create([
            'route_id' => $template->route_id,
            'bus_unit_id' => $template->bus_unit_id,
            'av_date' => $date,
            'av_time' => $time,
            'av_price' => ['adult' => 75000, 'child' => 50000, 'infant' => 0],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        DB::table('availability')
            ->where('availability_id', $availability->availability_id)
            ->update(['av_date' => $date]);

        $lastStop = $template->route->stops()->orderByDesc('stop_order')->firstOrFail();
        AvailabilityLeg::create([
            'availability_id' => $availability->availability_id,
            'route_stop_id' => $lastStop->route_stop_id,
            'seats_booked' => 0,
        ]);

        return $availability;
    }
}
