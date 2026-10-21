<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\BusType;
use App\Models\BusUnit;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Route;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminRekapGroupingTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    private Carbon $now;

    protected function setUp(): void
    {
        parent::setUp();
        $this->now = Carbon::parse('2026-10-20 14:00:00', $this->tz());
        Carbon::setTestNow($this->now);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_reports_group_by_company_and_filter_by_company_and_route(): void
    {
        $first = $this->makeBooking();
        $companyTwo = Company::create([
            'co_name' => 'PO Kedua',
            'co_address' => 'Jl. Dua',
            'co_phone' => '0822',
            'co_email' => 'po2@example.com',
        ]);
        $busType = BusType::create([
            'company_id' => $companyTwo->company_id,
            'bt_name' => 'bis kedua',
            'bt_capacity' => 32,
            'bt_use_seat_number' => true,
            'bt_seat_pattern' => '2-2',
        ]);
        $busUnit = BusUnit::create([
            'bus_type_id' => $busType->bus_type_id,
            'bu_code' => 'unit-po-dua',
            'bu_capacity' => 32,
            'is_active' => true,
        ]);
        $secondAvailability = $this->availability($first->availability->route_id, $busUnit->bus_unit_id, 2);
        $this->paidBooking($secondAvailability, ['bk_net_price' => 100000, 'bk_publish_price' => 120000, 'bk_total_price' => 130000]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson($this->reportUrl('kelompok=po'))
            ->assertOk()
            ->assertJsonCount(2, 'rincian')
            ->assertJsonPath('rincian.1.kunci', $first->availability->busUnit->busType->company_id)
            ->assertJsonPath('rincian.1.label', 'po uji')
            ->assertJsonPath('ringkasan.jumlah_booking', 2);

        $this->getJson($this->reportUrl('kelompok=po&company_id='.$companyTwo->company_id))
            ->assertOk()
            ->assertJsonCount(1, 'rincian')
            ->assertJsonPath('rincian.0.label', 'PO Kedua')
            ->assertJsonPath('ringkasan.setoran_po', 100000);

        $this->getJson($this->reportUrl('kelompok=po&company_id='.$first->availability->busUnit->busType->company_id.'&route_id='.$first->availability->route_id))
            ->assertOk()
            ->assertJsonCount(1, 'rincian')
            ->assertJsonPath('ringkasan.jumlah_booking', 1)
            ->assertJsonPath('ringkasan.setoran_po', 130000);
    }

    public function test_reports_group_by_route_and_filter_company_route_together(): void
    {
        $first = $this->makeBooking();
        $routeTwo = $this->newRoute($first->availability->route);
        $secondAvailability = $this->availability($routeTwo->route_id, $first->availability->bus_unit_id, 3);
        $this->paidBooking($secondAvailability, ['bk_net_price' => 90000]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson($this->reportUrl('kelompok=rute'))
            ->assertOk()
            ->assertJsonCount(2, 'rincian')
            ->assertJsonPath('ringkasan.jumlah_booking', 2)
            ->assertJsonPath('ringkasan.setoran_po', 220000);

        $this->getJson($this->reportUrl('kelompok=rute&company_id='.$first->availability->busUnit->busType->company_id.'&route_id='.$routeTwo->route_id))
            ->assertOk()
            ->assertJsonCount(1, 'rincian')
            ->assertJsonPath('rincian.0.kunci', $routeTwo->route_id)
            ->assertJsonPath('ringkasan.jumlah_booking', 1);
    }

    public function test_invalid_group_reversed_range_and_non_admin_are_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $this->getJson('/api/admin/booking/rekap?kelompok=tidak-valid')->assertUnprocessable();
        $this->getJson('/api/admin/booking/rekap?dari=2026-10-21&sampai=2026-10-20')->assertUnprocessable();

        auth()->forgetGuards();
        $this->getJson('/api/admin/booking/rekap?kelompok=po')->assertUnauthorized();
    }

    public function test_period_without_filters_keeps_legacy_fields_and_values(): void
    {
        $this->makeBooking();
        $base = $this->makeBooking();
        $cancelled = $this->paidBooking($base->availability, [
            'bk_status' => 'cancelled',
            'bk_refund_amount' => 112500,
            'bk_cancelled_at' => $this->now,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $summary = $this->getJson($this->reportUrl('kelompok=periode'))
            ->assertOk()
            ->json('ringkasan');

        $this->assertSame(2, $summary['jumlah_booking']);
        $this->assertSame(4, $summary['jumlah_tiket']);
        $this->assertSame(1, $summary['jumlah_pembatalan']);
        $this->assertEquals(280000, $summary['pendapatan_tiket']);
        $this->assertEquals(20000, $summary['biaya_layanan']);
        $this->assertEquals(300000, $summary['total_pendapatan']);
        $this->assertEquals(20000, $summary['komisi_platform']);
        $this->assertEquals(260000, $summary['setoran_po']);
        $this->assertEquals(150000, $summary['dibayar_dibatalkan']);
        $this->assertEquals(112500, $summary['total_refund']);
        $this->assertEquals(37500, $summary['ditahan']);
        $this->assertSame('total', $summary['periode']);
        $this->assertSame('total', $summary['kunci']);
        $this->assertSame('total', $summary['label']);
        $this->assertSame('cancelled', $cancelled->bk_status);
    }

    private function reportUrl(string $query): string
    {
        return '/api/admin/booking/rekap?'.$query.'&dari=2026-10-20&sampai=2026-10-20';
    }

    private function availability(int $routeId, int $busUnitId, int $day): Availability
    {
        return Availability::create([
            'route_id' => $routeId,
            'bus_unit_id' => $busUnitId,
            'av_date' => $this->now->copy()->addDays($day)->toDateString(),
            'av_time' => '10:00:00',
            'av_price' => ['adult' => 75000],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
    }

    private function paidBooking(Availability $availability, array $overrides = []): Booking
    {
        $contact = Contact::create([
            'ct_name' => 'Pemesan Uji',
            'ct_email' => 'pemesan-'.uniqid().'@example.com',
            'ct_phone' => '0812345678',
        ]);

        return Booking::create(array_merge([
            'availability_id' => $availability->availability_id,
            'contact_id' => $contact->contact_id,
            'bk_adult_count' => 2,
            'bk_child_count' => 0,
            'bk_infant_count' => 0,
            'bk_net_price' => 130000,
            'bk_publish_price' => 140000,
            'bk_total_price' => 150000,
            'bk_status' => 'paid',
            'bk_paid_at' => $this->now,
        ], $overrides));
    }

    private function newRoute(Route $base): Route
    {
        $destination = Station::create([
            'region_id' => $base->destinationStation->region_id,
            'stn_name' => 'terminal route dua',
            'stn_address' => 'Jl. Route Dua',
        ]);

        return Route::create([
            'origin_station_id' => $base->origin_station_id,
            'destination_station_id' => $destination->station_id,
            'rt_distance_km' => 250,
            'rt_duration_min' => 320,
        ]);
    }
}
