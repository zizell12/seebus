<?php

namespace Tests\Feature;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

/**
 * Kontrak penerimaan TAMBAHAN Fase 2 (kasus tepi yang lolos dari 17 test pertama).
 * Letakkan di backend/src/tests/Feature/. Jangan diubah atau dilonggarkan.
 */
class BookingCancellationEdgeTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.paypal.base_url' => 'https://paypal.test',
            'services.paypal.client_id' => 'client-uji',
            'services.paypal.secret' => 'secret-uji',
        ]);

        Http::preventStrayRequests();
    }

    private function cancel(Booking $booking, array $body = [])
    {
        Sanctum::actingAs($this->makeAdmin());

        return $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", $body + ['reason' => 'Alasan internal rahasia']);
    }

    private function fakeRefundOk(): void
    {
        Http::fake(['paypal.test/*' => Http::response(['id' => 'RF-1', 'status' => 'COMPLETED'], 201)]);
    }

    private function rekapHariIni(): array
    {
        $today = Carbon::now($this->tz())->toDateString();

        return $this->getJson("/api/admin/booking/rekap?mode=harian&dari={$today}&sampai={$today}")->assertOk()->json();
    }

    public function test_body_refund_tidak_membocorkan_alasan_internal_dan_memakai_field_resmi(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();

        $this->cancel($booking)->assertOk();

        Http::assertSent(function (Request $request) {
            $body = json_encode($request->data());

            return $request['amount']['value'] === '7.50'
                && ! array_key_exists('note', $request->data())              // bukan field resmi PayPal
                && str_contains((string) ($request['note_to_payer'] ?? ''), 'Refund tiket')
                && ! str_contains($body, 'Alasan internal rahasia');        // alasan admin tidak dikirim ke pembeli
        });
    }

    public function test_paypal_gagal_tidak_meninggalkan_data_refund_setengah_jadi(): void
    {
        Http::fake(['paypal.test/*' => Http::response(['name' => 'ERR'], 422)]);
        $booking = $this->makeBooking();

        $this->cancel($booking)->assertStatus(502);

        $booking->refresh();
        $this->assertSame('paid', $booking->bk_status);
        $this->assertNull($booking->bk_refund_percent);
        $this->assertNull($booking->bk_refund_amount);
        $this->assertNull($booking->bk_cancelled_at);
        $this->assertSame(2, $this->seatsBooked($booking));
    }

    public function test_status_refund_failed_dari_paypal_tidak_dianggap_berhasil(): void
    {
        Http::fake(['paypal.test/*' => Http::response(['id' => 'RF-9', 'status' => 'FAILED'], 201)]);
        $booking = $this->makeBooking();

        $this->cancel($booking)->assertStatus(502);

        $booking->refresh();
        $this->assertSame('paid', $booking->bk_status);
        $this->assertNull($booking->bk_paypal_refund_id);
        $this->assertSame(2, $this->seatsBooked($booking));
    }

    public function test_tiket_hangus_milik_booking_lama_tanpa_order_paypal_tetap_bisa_dibatalkan(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['with_capture' => false, 'departure' => Carbon::now($this->tz())->addHours(3)]);
        $booking->update(['bk_paypal_order_id' => null]);

        $this->cancel($booking)->assertOk()->assertJsonPath('data.pembatalan.refund_persen', 0);

        $this->assertSame('cancelled', $booking->refresh()->bk_status);
        $this->assertSame(0, $this->seatsBooked($booking));
        Http::assertNothingSent();
    }

    public function test_nominal_usd_tidak_diketahui_tidak_pernah_mengirim_refund_nol(): void
    {
        Http::fake(['paypal.test/*' => Http::response(['id' => 'RF-3', 'status' => 'COMPLETED'], 201)]);
        $booking = $this->makeBooking();
        $booking->update(['bk_paid_usd' => null]);   // capture id ada, nominal USD hilang

        $this->cancel($booking)->assertStatus(409);

        $this->assertSame('paid', $booking->refresh()->bk_status);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/refund'));
    }

    public function test_rekap_tiket_hangus_dicatat_sebagai_uang_ditahan_penuh(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(3)]);
        $this->cancel($booking)->assertOk();

        $ringkasan = $this->rekapHariIni()['ringkasan'];

        $this->assertSame(1, $ringkasan['jumlah_pembatalan']);
        $this->assertEquals(150000, $ringkasan['dibayar_dibatalkan']);
        $this->assertEquals(0, $ringkasan['total_refund']);
        $this->assertEquals(150000, $ringkasan['ditahan'], 'tiket hangus = seluruh uang ditahan');
    }

    public function test_rekap_booking_pending_yang_dibatalkan_bukan_uang_masuk(): void
    {
        Http::fake();
        $pending = $this->makeBooking(['status' => 'pending']);
        $this->cancel($pending)->assertOk();

        $ringkasan = $this->rekapHariIni()['ringkasan'];

        $this->assertSame(0, $ringkasan['jumlah_pembatalan'], 'yang belum dibayar bukan pembatalan berbayar');
        $this->assertEquals(0, $ringkasan['dibayar_dibatalkan']);
        $this->assertEquals(0, $ringkasan['ditahan']);
    }

    public function test_rincian_per_periode_memuat_pembatalan_walau_tidak_ada_penjualan(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();
        $this->cancel($booking)->assertOk();

        $rincian = $this->rekapHariIni()['rincian'];

        $this->assertCount(1, $rincian);
        $this->assertSame(0, $rincian[0]['jumlah_tiket']);
        $this->assertSame(1, $rincian[0]['jumlah_pembatalan']);
        $this->assertEquals(112500, $rincian[0]['total_refund']);
        $this->assertEquals(37500, $rincian[0]['ditahan']);
    }

    public function test_detail_booking_yang_sudah_berangkat_tidak_bisa_dibatalkan(): void
    {
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->subHours(2)]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson("/api/admin/booking/{$booking->booking_id}")->assertOk()
            ->assertJsonPath('data.bisa_dibatalkan', false)
            ->assertJsonPath('data.pratinjau_refund', null);
    }

    public function test_detail_booking_dibatalkan_memuat_data_untuk_halaman_admin(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();
        $this->cancel($booking)->assertOk();

        $this->getJson("/api/admin/booking/{$booking->booking_id}")->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled')
            ->assertJsonPath('data.bisa_dibatalkan', false)
            ->assertJsonPath('data.bk_total_price', 150000)
            ->assertJsonPath('data.kontak.nama', 'Budi Uji')
            ->assertJsonPath('data.kontak.email', 'budi@example.com')
            ->assertJsonPath('data.pembatalan.alasan', 'Alasan internal rahasia')
            ->assertJsonPath('data.pembatalan.refund_persen', 75)
            ->assertJsonPath('data.pembatalan.refund_jumlah', 112500)
            ->assertJsonPath('data.pembatalan.refund_id', 'RF-1');
    }

    public function test_daftar_booking_menyediakan_total_dan_refund_dan_bisa_dicari_lewat_email(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();
        $this->cancel($booking)->assertOk();

        $this->getJson('/api/admin/booking?q=budi@example.com')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.bk_total_price', 150000)
            ->assertJsonPath('data.0.bk_refund_amount', 112500);
    }

    public function test_release_expired_holds_memakai_pelepas_stok_yang_sama_dengan_pembatalan(): void
    {
        $sumberCommand = file_get_contents(base_path('app/Console/Commands/ReleaseExpiredHolds.php'));
        $sumberExpiry = file_get_contents(base_path('app/Services/BookingHoldExpiry.php'));

        $this->assertStringContainsString('BookingHoldExpiry', $sumberCommand, 'command memakai satu jalur expiry bersama');
        $this->assertStringContainsString('BookingStockReleaser::release', $sumberExpiry, 'logika stok memakai pelepas yang sama dengan pembatalan');
        $this->assertStringNotContainsString('legsBetween', $sumberCommand, 'ReleaseExpiredHolds tidak boleh menghitung etape sendiri');
    }
}
