<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminRekapSettlementTest extends TestCase
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

    public function test_settlement_splits_paid_departures_and_retained_refunds_then_sums_rows(): void
    {
        $departed = $this->makeBooking([
            'departure' => $this->now->copy()->subHour(),
        ]);
        $departed->update([
            'bk_net_price' => 100000,
            'bk_publish_price' => 120000,
            'bk_total_price' => 130000,
        ]);

        $upcoming = $this->makeBooking([
            'departure' => $this->now->copy()->addDays(2),
        ]);
        $upcoming->update([
            'bk_net_price' => 80000,
            'bk_publish_price' => 100000,
            'bk_total_price' => 110000,
        ]);

        $partial = $this->makeBooking();
        $partial->update([
            'bk_status' => 'cancelled',
            'bk_cancelled_at' => $this->now,
            'bk_net_price' => 130000,
            'bk_publish_price' => 140000,
            'bk_total_price' => 150000,
            'bk_refund_amount' => 112500,
        ]);
        $full = $this->makeBooking();
        $full->update([
            'bk_status' => 'cancelled',
            'bk_cancelled_at' => $this->now,
            'bk_refund_amount' => 150000,
        ]);

        Sanctum::actingAs($this->makeAdmin());
        $response = $this->getJson('/api/admin/booking/rekap?kelompok=po&dari=2026-10-20&sampai=2026-10-20')
            ->assertOk();
        $row = $response->json('rincian.0');
        $summary = $response->json('ringkasan');

        $this->assertEquals(100000, $row['setoran_po_siap']);
        $this->assertEquals(80000, $row['setoran_po_belum']);
        $this->assertEquals(27500, $row['ditahan_tiket']);
        $this->assertEquals(10000, $row['ditahan_biaya_layanan']);
        $this->assertEquals(25535.71, $row['ditahan_po']);
        $this->assertEquals(11964.29, $row['ditahan_platform']);
        $this->assertEquals(37500, $row['ditahan']);
        $this->assertEquals(125535.71, $row['siap_disetor']);
        $this->assertEquals(80000, $row['belum_berangkat']);
        $this->assertEquals(71964.29, $row['pendapatan_platform']);
        $this->assertEquals(
            round($row['komisi_platform'] + $row['biaya_layanan'] + $row['ditahan_platform'], 2),
            $row['pendapatan_platform'],
        );

        foreach ([
            'jumlah_booking', 'jumlah_tiket', 'jumlah_pembatalan', 'pendapatan_tiket',
            'biaya_layanan', 'total_pendapatan', 'komisi_platform', 'setoran_po',
            'dibayar_dibatalkan', 'total_refund', 'ditahan', 'setoran_po_siap',
            'setoran_po_belum', 'ditahan_tiket', 'ditahan_biaya_layanan', 'ditahan_po',
            'ditahan_platform', 'siap_disetor', 'belum_berangkat', 'pendapatan_platform',
        ] as $field) {
            $this->assertEquals($row[$field], $summary[$field], "ringkasan {$field} harus sama dengan jumlah baris");
        }

        $this->assertEquals(0, $full->bk_total_price - (float) $full->bk_refund_amount);
    }
}
