<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\RouteStop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_booking_endpoint_can_create_booking(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $before = $this->seatsBooked($existingBooking);
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $response = $this->postJson('/api/booking', $this->payload(
            $existingBooking->availability_id,
            $stops[0]->route_stop_id,
            $stops[1]->route_stop_id,
        ));

        $response->assertCreated()
            ->assertJsonStructure(['data' => ['booking_code', 'booking_id']]);

        $created = Booking::findOrFail($response->json('data.booking_id'));
        $this->assertSame('pending', $created->bk_status);
        $this->assertNotNull($created->bk_hold_until);
        $this->assertSame($before + 1, $this->seatsBooked($existingBooking));
    }

    public function test_booking_endpoint_rejects_full_leg_without_changing_stock_or_creating_booking(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $before = $this->seatsBooked($existingBooking);
        Availability::whereKey($existingBooking->availability_id)->update(['av_seats' => $before]);
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $bookingCount = Booking::where('availability_id', $existingBooking->availability_id)->count();

        $this->postJson('/api/booking', $this->payload(
            $existingBooking->availability_id,
            $stops[0]->route_stop_id,
            $stops[1]->route_stop_id,
        ))->assertUnprocessable();

        $this->assertSame($before, $this->seatsBooked($existingBooking));
        $this->assertSame($bookingCount, Booking::where('availability_id', $existingBooking->availability_id)->count());
    }

    public function test_infant_booking_does_not_reduce_leg_stock(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $before = $this->seatsBooked($existingBooking);
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->postJson('/api/booking', $this->payload(
            $existingBooking->availability_id,
            $stops[0]->route_stop_id,
            $stops[1]->route_stop_id,
            'infant',
        ))->assertCreated();

        $this->assertSame($before, $this->seatsBooked($existingBooking));
    }

    public function test_booking_endpoint_rejects_dropoff_before_or_at_pickup(): void
    {
        Mail::fake();
        $existingBooking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $existingBooking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        foreach ([[$stops[1]->route_stop_id, $stops[0]->route_stop_id], [$stops[0]->route_stop_id, $stops[0]->route_stop_id]] as [$from, $to]) {
            $this->postJson('/api/booking', $this->payload(
                $existingBooking->availability_id,
                $from,
                $to,
            ))->assertUnprocessable();
        }

        $this->assertSame(2, $this->seatsBooked($existingBooking));
    }

    private function payload(int $availabilityId, int $fromStopId, int $toStopId, string $category = 'adult'): array
    {
        return [
            'contact' => [
                'ct_name' => 'Rizky',
                'ct_email' => 'rizky@example.com',
                'ct_phone' => '081234567890',
                'ct_nationality' => 'Indonesia',
            ],
            'availability_id' => $availabilityId,
            'booking' => [
                'bk_notes' => 'Uji booking',
            ],
            'passengers' => [
                [
                    'from_stop_id' => $fromStopId,
                    'to_stop_id' => $toStopId,
                    'ps_category' => $category,
                    'ps_name' => 'Rizky',
                    'ps_age' => $category === 'infant' ? 0 : 28,
                    'ps_gender' => 'male',
                    'ps_nationality' => 'Indonesia',
                    'ps_seat_number' => $category === 'infant' ? null : '1A',
                ],
            ],
        ];
    }
}
