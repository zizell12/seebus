<?php

namespace Tests\Feature;

use App\Mail\BookingCancelledMail;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingCancelledPendingMailTest extends TestCase
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

        Http::preventStrayRequests();
    }

    private function cancel(Booking $booking, array $body = []): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($this->makeAdmin());

        return $this->postJson(
            "/api/admin/booking/{$booking->booking_id}/cancel",
            $body + ['reason' => 'Penumpang minta batal'],
        );
    }

    public function test_pending_booking_email_says_no_money_needs_refunding(): void
    {
        Mail::fake();
        Http::fake();
        $booking = $this->makeBooking(['status' => 'pending']);

        $this->cancel($booking)->assertOk();

        Mail::assertQueued(BookingCancelledMail::class, function (BookingCancelledMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('budi@example.com')
                && str_contains($html, 'belum melakukan pembayaran')
                && ! str_contains($html, 'tidak mendapat pengembalian dana')
                && ! str_contains($html, 'Persentase refund');
        });
        Mail::assertQueuedCount(1);
    }

    public function test_paid_booking_without_refund_keeps_policy_refund_message(): void
    {
        Mail::fake();
        Http::fake();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(5)]);

        $this->cancel($booking)->assertOk();

        Mail::assertQueued(BookingCancelledMail::class, function (BookingCancelledMail $mail) {
            $html = $mail->render();

            return str_contains($html, 'tidak mendapat pengembalian dana')
                && ! str_contains($html, 'belum melakukan pembayaran');
        });
    }

    public function test_paid_booking_with_refund_email_shows_refund_percentage_and_amount(): void
    {
        Mail::fake();
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-1', 'status' => 'COMPLETED'], 201),
        ]);
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addDays(3)]);

        $this->cancel($booking)->assertOk();

        Mail::assertQueued(BookingCancelledMail::class, function (BookingCancelledMail $mail) {
            $html = $mail->render();

            return str_contains($html, 'Persentase refund')
                && str_contains($html, 'Rp 112.500');
        });
    }

    public function test_mailable_without_paid_argument_defaults_to_paid_behavior(): void
    {
        $booking = $this->makeBooking();

        $html = (new BookingCancelledMail($booking))->render();

        $this->assertStringContainsString('tidak mendapat pengembalian dana', $html);
        $this->assertStringNotContainsString('belum melakukan pembayaran', $html);
    }
}
