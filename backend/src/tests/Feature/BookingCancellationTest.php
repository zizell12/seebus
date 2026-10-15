<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Services\RefundPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingCancellationTest extends TestCase
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
            'refund.threshold_hours' => 24,
            'refund.percent_before_threshold' => 75,
            'refund.percent_within_threshold' => 0,
        ]);

        // Test tidak boleh pernah menyentuh PayPal sungguhan.
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function fakeRefundOk(): void
    {
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-1', 'status' => 'COMPLETED'], 201),
        ]);
    }

    private function cancel(Booking $booking, array $body = []): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($this->makeAdmin());

        return $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", $body + ['reason' => 'Penumpang minta batal']);
    }

    public function test_refund_75_persen_kalau_lebih_dari_24_jam_sebelum_berangkat(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addDays(3)]);

        $this->cancel($booking)->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled')
            ->assertJsonPath('data.pembatalan.refund_persen', 75)
            ->assertJsonPath('data.pembatalan.refund_jumlah', 112500)
            ->assertJsonPath('data.pembatalan.refund_usd', 7.5)
            ->assertJsonPath('data.pembatalan.refund_id', 'RF-1');

        $booking->refresh();
        $this->assertSame('cancelled', $booking->bk_status);
        $this->assertSame('RF-1', $booking->bk_paypal_refund_id);
        $this->assertNotNull($booking->bk_refunded_at);
        $this->assertSame('Penumpang minta batal', $booking->bk_cancel_reason);
        $this->assertSame(0, $this->seatsBooked($booking), 'stok kursi harus kembali');

        Http::assertSentCount(1);
        // Kunci idempotensi memuat kode booking & persen, jadi request yang
        // diulang (timeout/klik ganda) tidak membuat refund kedua di PayPal.
        $kunci = "seebus-refund-{$booking->bk_code}-75";
        Http::assertSent(function (Request $request) use ($kunci) {
            return str_ends_with($request->url(), '/v2/payments/captures/CAP-1/refund')
                && $request['amount']['value'] === '7.50'
                && $request['amount']['currency_code'] === 'USD'
                && $request->header('PayPal-Request-Id') === [$kunci];
        });
    }

    public function test_tiket_hangus_kalau_kurang_dari_24_jam_dan_tidak_menyentuh_paypal(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(5)]);

        $this->cancel($booking)->assertOk()
            ->assertJsonPath('data.pembatalan.refund_persen', 0)
            ->assertJsonPath('data.pembatalan.refund_jumlah', 0)
            ->assertJsonPath('data.pembatalan.refund_id', null);

        $this->assertSame('cancelled', $booking->refresh()->bk_status);
        $this->assertNull($booking->bk_refunded_at);
        $this->assertSame(0, $this->seatsBooked($booking));
        Http::assertNothingSent();
    }

    public function test_mode_penuh_mengembalikan_100_persen_walau_kurang_dari_24_jam(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(5)]);

        $this->cancel($booking, ['refund_mode' => 'penuh', 'reason' => 'Bus dibatalkan operator'])->assertOk()
            ->assertJsonPath('data.pembatalan.refund_persen', 100)
            ->assertJsonPath('data.pembatalan.refund_jumlah', 150000)
            ->assertJsonPath('data.pembatalan.refund_usd', 10);

        Http::assertSent(fn (Request $request) => $request['amount']['value'] === '10.00');
    }

    public function test_batas_tepat_24_jam_masih_dapat_75_persen_dan_di_bawahnya_hangus(): void
    {
        $now = Carbon::create(2026, 10, 5, 10, 0, 0, $this->tz());
        Carbon::setTestNow($now);

        $tepat = $this->makeBooking(['departure' => $now->copy()->addHours(24)]);
        $kurang = $this->makeBooking(['departure' => $now->copy()->addHours(24)->subMinute()]);

        $this->assertSame(75, RefundPolicy::evaluate($tepat->load('availability'))['persen']);
        $this->assertSame(0, RefundPolicy::evaluate($kurang->load('availability'))['persen']);
    }

    public function test_pembatalan_booking_pending_melepas_stok_tanpa_refund(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['status' => 'pending']);

        $this->cancel($booking)->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled')
            ->assertJsonPath('data.pembatalan.refund_persen', null);

        $this->assertSame(0, $this->seatsBooked($booking));
        Http::assertNothingSent();
    }

    public function test_refund_hanya_bisa_sekali(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();

        $this->cancel($booking)->assertOk();
        $this->cancel($booking)->assertStatus(422);

        Http::assertSentCount(1);
        $this->assertSame(0, $this->seatsBooked($booking), 'stok tidak boleh dikurangi dua kali');
    }

    public function test_paypal_gagal_booking_tetap_paid_dan_stok_tidak_berubah(): void
    {
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['name' => 'UNPROCESSABLE_ENTITY'], 422),
        ]);
        $booking = $this->makeBooking();

        $this->cancel($booking)->assertStatus(502);

        $booking->refresh();
        $this->assertSame('paid', $booking->bk_status);
        $this->assertNull($booking->bk_cancelled_at);
        $this->assertNull($booking->bk_paypal_refund_id);
        $this->assertSame(2, $this->seatsBooked($booking));
    }

    public function test_booking_lama_tanpa_capture_id_dilengkapi_dari_order_paypal(): void
    {
        Http::fake([
            'paypal.test/v2/checkout/orders/ORDER-1' => Http::response([
                'purchase_units' => [['payments' => ['captures' => [
                    ['id' => 'CAP-LAMA', 'amount' => ['currency_code' => 'USD', 'value' => '10.00']],
                ]]]],
            ], 200),
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-2', 'status' => 'COMPLETED'], 201),
        ]);
        $booking = $this->makeBooking(['with_capture' => false]);

        $this->cancel($booking)->assertOk()->assertJsonPath('data.pembatalan.refund_usd', 7.5);

        $this->assertSame('CAP-LAMA', $booking->refresh()->bk_paypal_capture_id);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/captures/CAP-LAMA/refund'));
    }

    public function test_booking_lama_tanpa_order_paypal_ditolak_agar_diproses_manual(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['with_capture' => false]);
        $booking->update(['bk_paypal_order_id' => null]);

        $this->cancel($booking)->assertStatus(409);

        $this->assertSame('paid', $booking->refresh()->bk_status);
        Http::assertNothingSent();
    }

    public function test_booking_setelah_berangkat_tidak_bisa_dibatalkan(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->subHours(2)]);

        $this->cancel($booking)->assertStatus(422);

        $this->assertSame('paid', $booking->refresh()->bk_status);
        Http::assertNothingSent();
    }

    public function test_booking_expired_tidak_bisa_dibatalkan(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['status' => 'expired', 'hold_until' => now()->subHour()]);

        $this->cancel($booking)->assertStatus(422);
    }

    public function test_alasan_wajib_diisi_dan_mode_harus_valid(): void
    {
        Http::fake();
        $booking = $this->makeBooking();
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", [])->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", ['reason' => 'ok', 'refund_mode' => 'x'])->assertStatus(422);
        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", ['reason' => 'Alasan valid', 'refund_mode' => 'x'])
            ->assertStatus(422)->assertJsonValidationErrors('refund_mode');

        $this->assertSame('paid', $booking->refresh()->bk_status);
    }

    public function test_hanya_admin_yang_boleh_membatalkan(): void
    {
        Http::fake();
        $booking = $this->makeBooking();

        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", ['reason' => 'Percobaan tanpa login'])->assertStatus(401);

        $customer = \App\Models\User::create([
            'usr_name' => 'Cust', 'usr_email' => 'cust@example.com', 'usr_password_hash' => bcrypt('x'), 'usr_role' => 'customer',
        ]);
        Sanctum::actingAs($customer);
        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", ['reason' => 'Percobaan customer'])->assertStatus(403);

        $this->assertSame('paid', $booking->refresh()->bk_status);
    }

    public function test_daftar_dan_detail_booking_admin(): void
    {
        $paid = $this->makeBooking();
        $pending = $this->makeBooking(['status' => 'pending']);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/booking')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/booking?status=pending')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.bk_code', $pending->bk_code);
        $this->getJson('/api/admin/booking?q='.strtolower($paid->bk_code))->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.bk_code', $paid->bk_code);
        $this->getJson('/api/admin/booking?status=bukan-status')->assertStatus(422);

        $this->getJson("/api/admin/booking/{$paid->booking_id}")->assertOk()
            ->assertJsonPath('data.bisa_dibatalkan', true)
            ->assertJsonPath('data.pratinjau_refund.kebijakan.persen', 75)
            ->assertJsonPath('data.pratinjau_refund.kebijakan.jumlah', 112500)
            ->assertJsonPath('data.pratinjau_refund.penuh.persen', 100)
            ->assertJsonCount(2, 'data.penumpang');

        $this->getJson("/api/admin/booking/{$pending->booking_id}")->assertOk()
            ->assertJsonPath('data.bisa_dibatalkan', true)
            ->assertJsonPath('data.pratinjau_refund', null);
    }

    public function test_lookup_pembeli_menampilkan_refund_tanpa_alasan_internal(): void
    {
        $this->fakeRefundOk();
        $booking = $this->makeBooking();
        $this->cancel($booking, ['reason' => 'Catatan internal admin'])->assertOk();

        $response = $this->postJson('/api/booking/lookup', ['bk_code' => $booking->bk_code, 'email' => 'budi@example.com'])
            ->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled')
            ->assertJsonPath('data.pembatalan.refund_persen', 75)
            ->assertJsonPath('data.pembatalan.refund_jumlah', 112500);

        $this->assertStringNotContainsString('Catatan internal admin', $response->getContent());
    }

    public function test_rekap_memisahkan_terjual_pembatalan_refund_dan_uang_ditahan(): void
    {
        $this->fakeRefundOk();
        $terjual = $this->makeBooking();
        $direfund = $this->makeBooking();                                                       // refund 75%
        $hangus = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(3)]);  // hangus

        $this->cancel($direfund)->assertOk();
        $this->cancel($hangus)->assertOk();

        $today = Carbon::now($this->tz())->toDateString();
        $data = $this->getJson("/api/admin/booking/rekap?mode=harian&dari={$today}&sampai={$today}")->assertOk()->json('ringkasan');

        // Hanya 1 booking yang masih 'paid' (2 penumpang) dihitung terjual.
        $this->assertSame(1, $data['jumlah_booking']);
        $this->assertSame(2, $data['jumlah_tiket']);
        $this->assertEquals(150000, $data['total_pendapatan']);

        // 2 dibatalkan: dibayar 300.000, refund 112.500, ditahan 187.500.
        $this->assertSame(2, $data['jumlah_pembatalan']);
        $this->assertEquals(300000, $data['dibayar_dibatalkan']);
        $this->assertEquals(112500, $data['total_refund']);
        $this->assertEquals(187500, $data['ditahan']);

        $csv = $this->get("/api/admin/booking/export?mode=harian&dari={$today}&sampai={$today}")->assertOk()->getContent();
        $this->assertStringContainsString('Pembatalan,Dibayar Dibatalkan (Rp),Refund (Rp),Ditahan (Rp)', $csv);
    }

    public function test_hold_kedaluwarsa_tetap_melepas_stok_setelah_refactor(): void
    {
        $booking = $this->makeBooking(['status' => 'pending', 'hold_until' => now()->subMinutes(5)]);
        $this->assertSame(2, $this->seatsBooked($booking));

        $this->artisan('bookings:release-expired-holds')->assertSuccessful();

        $this->assertSame('expired', $booking->refresh()->bk_status);
        $this->assertSame(0, $this->seatsBooked($booking));
    }
}
