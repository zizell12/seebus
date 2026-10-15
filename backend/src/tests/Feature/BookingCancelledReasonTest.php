<?php

namespace Tests\Feature;

use App\Mail\BookingCancelledMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingCancelledReasonTest extends TestCase
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

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_cancellation_emails_never_include_internal_reason(): void
    {
        Mail::fake();
        Http::fake([
            'paypal.test/v2/payments/captures/*/refund' => Http::response(['id' => 'RF-1', 'status' => 'COMPLETED'], 201),
        ]);

        $bookings = [
            $this->makeBooking(['departure' => Carbon::now($this->tz())->addDays(3)]),
            $this->makeBooking(['status' => 'pending']),
            $this->makeBooking(['departure' => Carbon::now($this->tz())->addHours(5)]),
        ];

        foreach ($bookings as $booking) {
            Sanctum::actingAs($this->makeAdmin());
            $this->postJson(
                "/api/admin/booking/{$booking->booking_id}/cancel",
                ['reason' => 'CATATAN INTERNAL RAHASIA'],
            )->assertOk();
        }

        foreach ($bookings as $booking) {
            Mail::assertQueued(
                BookingCancelledMail::class,
                function (BookingCancelledMail $mail) use ($booking): bool {
                    if ($mail->booking->booking_id !== $booking->booking_id) {
                        return false;
                    }

                    $this->assertStringNotContainsString('CATATAN INTERNAL RAHASIA', $mail->render());

                    return true;
                },
            );
        }

        Mail::assertQueuedCount(3);
    }
}
