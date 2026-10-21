<?php

namespace Tests\Feature;

use App\Mail\BookingCancelledMail;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Passenger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminJadwalProtectionTest extends TestCase
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
        Sanctum::actingAs($this->makeAdmin());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_departure_time_change_is_rejected_for_paid_and_active_pending_bookings(): void
    {
        $paid = $this->makeBooking();
        $this->putJson("/api/admin/jadwal/{$paid->availability_id}", ['av_time' => '09:30'])
            ->assertStatus(409)
            ->assertJsonPath('message', 'Jam tidak dapat diubah karena sudah ada 1 booking aktif. Batalkan booking terkait dulu.');

        $pending = $this->makeBooking(['status' => 'pending']);
        $this->putJson("/api/admin/jadwal/{$pending->availability_id}", ['av_time' => '09:30'])
            ->assertStatus(409);
    }

    public function test_departure_time_can_change_when_only_expired_or_cancelled_bookings_exist(): void
    {
        $expired = $this->makeBooking([
            'status' => 'pending',
            'hold_until' => Carbon::now($this->tz())->subMinute(),
        ]);
        $this->copyBooking($expired, 'cancelled', null);

        $this->putJson("/api/admin/jadwal/{$expired->availability_id}", ['av_time' => '09:30'])
            ->assertOk()
            ->assertJsonPath('dibatalkan', 0);
    }

    public function test_deactivation_without_confirmation_returns_active_booking_counts(): void
    {
        $paid = $this->makeBooking();
        $this->copyBooking($paid, 'pending', Carbon::now($this->tz())->addMinutes(20));

        $this->putJson("/api/admin/jadwal/{$paid->availability_id}", ['av_status' => 'inactive'])
            ->assertStatus(409)
            ->assertJsonPath('jumlah_booking_aktif', 2)
            ->assertJsonPath('jumlah_paid', 1)
            ->assertJsonPath('jumlah_pending', 1);
    }

    public function test_repeated_deactivation_still_requires_confirmation_for_active_bookings(): void
    {
        $booking = $this->makeBooking();
        $booking->availability->update(['av_status' => 'inactive']);

        $this->putJson("/api/admin/jadwal/{$booking->availability_id}", ['av_status' => 'inactive'])
            ->assertStatus(409)
            ->assertJsonPath('jumlah_booking_aktif', 1);
    }

    public function test_confirmed_deactivation_cancels_every_active_booking_refunds_and_emails_contacts(): void
    {
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-ADMIN', 'status' => 'COMPLETED'], 201),
        ]);
        Mail::fake();
        $paid = $this->makeBooking();
        $pending = $this->copyBooking($paid, 'pending', Carbon::now($this->tz())->addMinutes(20));

        $this->putJson("/api/admin/jadwal/{$paid->availability_id}", [
            'av_status' => 'inactive',
            'batalkan_booking' => true,
        ])->assertOk()->assertJsonPath('dibatalkan', 2);

        $this->assertSame('cancelled', $paid->refresh()->bk_status);
        $this->assertSame('cancelled', $pending->refresh()->bk_status);
        $this->assertSame(0, $this->seatsBooked($paid));
        $this->assertSame('inactive', $paid->availability->fresh()->av_status);
        Mail::assertQueued(BookingCancelledMail::class, 2);
        Http::assertSentCount(1);
    }

    public function test_failed_refund_keeps_schedule_active_and_reports_booking_code(): void
    {
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['name' => 'UNPROCESSABLE_ENTITY'], 422),
        ]);
        $paid = $this->makeBooking();

        $this->putJson("/api/admin/jadwal/{$paid->availability_id}", [
            'av_status' => 'inactive',
            'batalkan_booking' => true,
        ])->assertUnprocessable()
            ->assertJsonPath('gagal.0', $paid->bk_code)
            ->assertJsonPath('dibatalkan', 0);

        $this->assertSame('active', $paid->availability->fresh()->av_status);
        $this->assertSame('paid', $paid->refresh()->bk_status);
        $this->assertSame(2, $this->seatsBooked($paid));
    }

    public function test_departed_schedule_is_not_protected_but_cannot_be_reactivated(): void
    {
        $booking = $this->makeBooking([
            'departure' => Carbon::now($this->tz())->subHours(2),
        ]);
        $this->putJson("/api/admin/jadwal/{$booking->availability_id}", ['av_status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('dibatalkan', 0);

        $this->putJson("/api/admin/jadwal/{$booking->availability_id}", ['av_status' => 'active'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Jadwal yang waktu berangkatnya sudah lewat tidak dapat diaktifkan kembali.');
    }

    public function test_destroy_uses_the_same_confirmation_guard(): void
    {
        $booking = $this->makeBooking();

        $this->deleteJson("/api/admin/jadwal/{$booking->availability_id}")
            ->assertStatus(409)
            ->assertJsonPath('jumlah_booking_aktif', 1);
    }

    private function copyBooking(Booking $source, string $status, ?Carbon $holdUntil): Booking
    {
        $contact = Contact::create([
            'ct_name' => 'Kontak tambahan',
            'ct_email' => 'tambahan@example.com',
            'ct_phone' => '0812345679',
        ]);
        $booking = Booking::create([
            'availability_id' => $source->availability_id,
            'contact_id' => $contact->contact_id,
            'bk_adult_count' => 2,
            'bk_child_count' => 0,
            'bk_infant_count' => 0,
            'bk_net_price' => 130000,
            'bk_publish_price' => 140000,
            'bk_total_price' => 150000,
            'bk_status' => $status,
            'bk_hold_until' => $holdUntil,
        ]);

        $source->loadMissing('passengers');
        foreach ($source->passengers as $passenger) {
            Passenger::create([
                'booking_id' => $booking->booking_id,
                'from_stop_id' => $passenger->from_stop_id,
                'to_stop_id' => $passenger->to_stop_id,
                'ps_category' => $passenger->ps_category,
                'ps_name' => $passenger->ps_name.' Tambahan',
                'ps_age' => $passenger->ps_age,
                'ps_gender' => $passenger->ps_gender,
            ]);
        }

        \App\Models\AvailabilityLeg::where('availability_id', $source->availability_id)
            ->increment('seats_booked', 2);

        return $booking;
    }
}
