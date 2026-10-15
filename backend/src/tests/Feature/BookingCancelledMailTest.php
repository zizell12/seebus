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

class BookingCancelledMailTest extends TestCase
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

    public function test_paid_booking_with_refund_sends_cancellation_email_once(): void
    {
        Mail::fake();
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-1', 'status' => 'COMPLETED'], 201),
        ]);
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addDays(3)]);

        $this->cancel($booking)->assertOk();

        Mail::assertQueued(BookingCancelledMail::class, fn (BookingCancelledMail $mail) =>
            $mail->hasTo('budi@example.com') && $mail->booking->booking_id === $booking->booking_id
        );
        Mail::assertQueuedCount(1);
    }

    public function test_cancellation_without_refund_sends_renderable_email(): void
    {
        Mail::fake();
        Http::fake();
        $booking = $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(5)]);

        $this->cancel($booking)->assertOk();

        Mail::assertQueued(BookingCancelledMail::class, function (BookingCancelledMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('budi@example.com')
                && str_contains($html, 'Sesuai kebijakan pembatalan, booking ini tidak mendapat pengembalian dana.');
        });
    }

    public function test_rejected_cancellation_does_not_send_email(): void
    {
        Mail::fake();
        Http::fake();
        $booking = $this->makeBooking(['status' => 'expired']);

        $this->cancel($booking)->assertUnprocessable();

        Mail::assertNothingSent();
        Mail::assertNothingQueued();
    }

    public function test_mailer_exception_does_not_fail_successful_cancellation(): void
    {
        Http::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        Mail::shouldReceive('to')
            ->once()
            ->with('budi@example.com')
            ->andThrow(new \RuntimeException('Mailer tidak tersedia'));

        $this->cancel($booking)->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled');

        $this->assertSame('cancelled', $booking->refresh()->bk_status);
    }
}
