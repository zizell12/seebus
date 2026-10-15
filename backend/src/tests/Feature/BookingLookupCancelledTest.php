<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingLookupCancelledTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_lookup_cancelled_paid_booking_keeps_null_refund_usd_and_reports_payment(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled']);
        $booking->update(['bk_refund_usd' => null]);

        $this->lookup($booking->bk_code)
            ->assertOk()
            ->assertJsonPath('data.pembatalan.refund_usd', null)
            ->assertJsonPath('data.pembatalan.sudah_dibayar', true);
    }

    public function test_lookup_cancelled_booking_without_payment_reports_not_paid(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled']);
        $booking->update([
            'bk_paid_at' => null,
            'bk_paypal_capture_id' => null,
        ]);

        $this->lookup($booking->bk_code)
            ->assertOk()
            ->assertJsonPath('data.pembatalan.sudah_dibayar', false);
    }

    public function test_lookup_paid_booking_has_no_cancellation_data(): void
    {
        $booking = $this->makeBooking(['status' => 'paid']);

        $this->lookup($booking->bk_code)
            ->assertOk()
            ->assertJsonPath('data.pembatalan', null);
    }

    public function test_lookup_cancelled_booking_returns_refund_usd_as_number(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled']);
        $booking->update(['bk_refund_usd' => 12.5]);

        $this->lookup($booking->bk_code)
            ->assertOk()
            ->assertJsonPath('data.pembatalan.refund_usd', 12.5);
    }

    private function lookup(string $bookingCode): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/booking/lookup', [
            'bk_code' => $bookingCode,
            'email' => 'budi@example.com',
        ]);
    }
}
