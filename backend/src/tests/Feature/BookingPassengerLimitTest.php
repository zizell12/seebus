<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\RouteStop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingPassengerLimitTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    private const PASSENGER_LIMIT = 10;

    public function test_booking_rejects_more_than_ten_passengers_without_creating_booking(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $bookingCount = Booking::where('availability_id', $existingBooking->availability_id)->count();
        $payload = $this->payload($existingBooking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'] = array_fill(0, self::PASSENGER_LIMIT + 1, $payload['passengers'][0]);

        $this->postJson('/api/booking', $payload)->assertUnprocessable();

        $this->assertSame($bookingCount, Booking::where('availability_id', $existingBooking->availability_id)->count());
    }

    public function test_booking_rejects_passenger_age_above_120(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $payload = $this->payload($existingBooking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'][0]['ps_age'] = 150;

        $this->postJson('/api/booking', $payload)->assertUnprocessable();
    }

    public function test_booking_still_accepts_one_normal_passenger(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->postJson('/api/booking', $this->payload(
            $existingBooking->availability_id,
            $stops[0]->route_stop_id,
            $stops[1]->route_stop_id,
        ))->assertCreated();
    }

    private function payload(int $availabilityId, int $fromStopId, int $toStopId): array
    {
        return [
            'contact' => [
                'ct_name' => 'Rizky',
                'ct_email' => 'rizky@example.com',
                'ct_phone' => '081234567890',
                'ct_nationality' => 'Indonesia',
            ],
            'availability_id' => $availabilityId,
            'booking' => ['bk_notes' => 'Uji batas penumpang'],
            'passengers' => [[
                'from_stop_id' => $fromStopId,
                'to_stop_id' => $toStopId,
                'ps_category' => 'adult',
                'ps_name' => 'Rizky',
                'ps_age' => 28,
                'ps_gender' => 'male',
                'ps_nationality' => 'Indonesia',
                'ps_seat_number' => '1A',
            ]],
        ];
    }
}
