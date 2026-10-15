<?php

namespace Tests\Feature;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingAdminDetailUsdTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    private function getDetail(Booking $booking): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($this->makeAdmin());

        return $this->getJson("/api/admin/booking/{$booking->booking_id}");
    }

    public function test_cancelled_booking_without_usd_refund_returns_null(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled']);
        $booking->update([
            'bk_refund_percent' => 50,
            'bk_refund_amount' => 100000,
            'bk_refund_usd' => null,
        ]);

        $this->getDetail($booking)->assertOk()
            ->assertJsonPath('data.pembatalan.refund_usd', null);
    }

    public function test_cancelled_booking_with_usd_refund_returns_amount(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled']);
        $booking->update([
            'bk_refund_percent' => 50,
            'bk_refund_amount' => 100000,
            'bk_refund_usd' => 12.5,
        ]);

        $this->getDetail($booking)->assertOk()
            ->assertJsonPath('data.pembatalan.refund_usd', 12.5);
    }
}
