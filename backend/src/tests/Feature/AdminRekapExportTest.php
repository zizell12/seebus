<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\BusType;
use App\Models\BusUnit;
use App\Models\Company;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminRekapExportTest extends TestCase
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

    public function test_grouped_exports_contain_settlement_columns_values_and_safe_labels(): void
    {
        $paid = $this->makeBooking([
            'departure' => $this->now->copy()->subHours(1),
        ]);
        $paid->availability->busUnit->busType->company->update(['co_name' => '=Formula PO']);
        Sanctum::actingAs($this->makeAdmin());

        $poCsv = $this->get('/api/admin/booking/export?kelompok=po&dari=2026-10-20&sampai=2026-10-20')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->getContent();
        $this->assertStringContainsString(
            'Kelompok,Booking,Tiket Terjual,Pendapatan Tiket (Rp),Biaya Layanan (Rp),Komisi Platform (Rp),Setoran PO (Rp),Siap Disetor (Rp),Belum Berangkat (Rp),Pembatalan,Refund (Rp),Ditahan (Rp),Pendapatan Platform (Rp)',
            $poCsv,
        );
        $this->assertStringContainsString("'=Formula PO,1,2,140000,10000,10000,130000,130000,0,0,0,0,20000", $poCsv);

        $routeResponse = $this->get('/api/admin/booking/export?kelompok=rute&dari=2026-10-20&sampai=2026-10-20')
            ->assertOk();
        $routeCsv = $routeResponse->getContent();
        $this->assertStringContainsString('terminal jember - terminal surabaya,1,2,140000', $routeCsv);
        $this->assertStringContainsString('filename=laporan-penjualan-rute-2026-10-20_2026-10-20.csv', $routeResponse->headers->get('content-disposition'));
    }

    public function test_period_export_header_remains_unchanged_and_safe_label_prefixes_are_escaped(): void
    {
        $booking = $this->makeBooking();
        $booking->update(['bk_paid_at' => $this->now]);
        Sanctum::actingAs($this->makeAdmin());

        $csv = $this->get('/api/admin/booking/export?kelompok=periode&mode=harian&dari=2026-10-20&sampai=2026-10-20')
            ->assertOk()
            ->getContent();
        $this->assertStringStartsWith(
            "Tanggal,Tiket Terjual,Pendapatan Tiket (Rp),Biaya Layanan (Rp),Total Dibayar (Rp),Pembatalan,Dibayar Dibatalkan (Rp),Refund (Rp),Ditahan (Rp)\n",
            $csv,
        );

        $company = $booking->availability->busUnit->busType->company;
        foreach (['=danger', '+danger', '-danger', '@danger'] as $prefix) {
            $company->update(['co_name' => $prefix]);
            $safeCsv = $this->get('/api/admin/booking/export?kelompok=po&dari=2026-10-20&sampai=2026-10-20')
                ->assertOk()
                ->getContent();
            $this->assertStringContainsString("'".$prefix.',', $safeCsv);
        }
    }

    public function test_settlement_export_filters_company_and_shows_statuses_and_totals(): void
    {
        $ready = $this->makeBooking([
            'departure' => $this->now->copy()->subHours(2),
        ]);
        $upcoming = $this->makeBooking([
            'departure' => $this->now->copy()->addDays(2),
        ]);
        $otherCompany = Company::create([
            'co_name' => 'PO lain',
            'co_address' => 'Jl. Lain',
            'co_phone' => '0800',
            'co_email' => 'lain@example.com',
        ]);
        $otherBusType = BusType::create([
            'company_id' => $otherCompany->company_id,
            'bt_name' => 'lain',
            'bt_capacity' => 32,
            'bt_use_seat_number' => true,
            'bt_seat_pattern' => '2-2',
        ]);
        $otherBusUnit = BusUnit::create([
            'bus_type_id' => $otherBusType->bus_type_id,
            'bu_code' => 'unit-po-lain',
            'bu_capacity' => 32,
            'is_active' => true,
        ]);
        $otherAvailability = Availability::create([
            'route_id' => $ready->availability->route_id,
            'bus_unit_id' => $otherBusUnit->bus_unit_id,
            'av_date' => $this->now->copy()->addDays(2)->toDateString(),
            'av_time' => '10:00:00',
            'av_price' => ['adult' => 75000],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);
        $otherBooking = $this->bookingFor($otherAvailability);
        Sanctum::actingAs($this->makeAdmin());
        $companyId = $ready->availability->busUnit->busType->company_id;

        $csv = $this->get("/api/admin/booking/setoran-export?company_id={$companyId}&dari=2026-10-20&sampai=2026-10-20")
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('Kode Booking,Tanggal Bayar,Tanggal Berangkat,Jam Berangkat,Rute,Armada,Penumpang,Harga Tiket (Rp),Setoran PO (Rp),Status', $csv);
        $this->assertStringContainsString($ready->bk_code, $csv);
        $this->assertStringContainsString($upcoming->bk_code, $csv);
        $this->assertStringNotContainsString($otherBooking->bk_code, $csv);
        $this->assertStringContainsString('Siap disetor', $csv);
        $this->assertStringContainsString('Belum berangkat', $csv);
        $this->assertStringContainsString('TOTAL,,,,,,,,260000,Siap disetor: 130000.00; Belum berangkat: 130000.00', $csv);

        $this->get('/api/admin/booking/setoran-export')->assertUnprocessable();
        auth()->forgetGuards();
        $this->getJson('/api/admin/booking/setoran-export?company_id='.$companyId)->assertUnauthorized();
    }

    private function bookingFor(Availability $availability): Booking
    {
        $contact = Contact::create([
            'ct_name' => 'Pemesan Kedua',
            'ct_email' => 'pemesan-'.uniqid().'@example.com',
            'ct_phone' => '0812345679',
        ]);

        return Booking::create([
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
        ]);
    }
}
