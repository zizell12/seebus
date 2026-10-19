<?php

namespace Tests\Feature;

use App\Mail\TicketMail;
use App\Models\AvailabilityLeg;
use App\Models\Booking;
use App\Models\Passenger;
use App\Models\RouteStop;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class BookingSeatAssignmentTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_stop_endpoint_includes_current_seat_configuration(): void
    {
        $booking = $this->makeBooking();

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/titik-pemberhentian')
            ->assertOk()
            ->assertJsonPath('meta.pakai_nomor_kursi', true)
            ->assertJsonPath('meta.pola_kursi', '2-2');
    }

    public function test_seat_map_returns_available_seats_for_selected_segment(): void
    {
        $booking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/seat-map?from_stop_id='.$stops[0]->route_stop_id.'&to_stop_id='.$stops[1]->route_stop_id)
            ->assertOk()
            ->assertJsonPath('data.seats.0.seat_number', '1A')
            ->assertJsonPath('data.seats.0.available', true);
    }

    public function test_seat_map_uses_the_bus_type_pattern(): void
    {
        $booking = $this->makeBooking();
        $booking->availability->busUnit->busType->update(['bt_seat_pattern' => '1-2']);
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/seat-map?from_stop_id='.$stops[0]->route_stop_id.'&to_stop_id='.$stops[1]->route_stop_id)
            ->assertOk()
            ->assertJsonPath('data.pola_kursi', '1-2')
            ->assertJsonPath('data.rows.0.0.seat_number', '1A')
            ->assertJsonPath('data.rows.0.1.seat_number', '1B')
            ->assertJsonPath('data.rows.0.2.seat_number', '1C')
            ->assertJsonPath('data.rows.0.0.grid_column', 1)
            ->assertJsonPath('data.rows.0.1.grid_column', 4)
            ->assertJsonPath('data.rows.0.2.grid_column', 5);
    }

    public function test_booking_reserves_selected_seat_for_overlapping_segment(): void
    {
        Mail::fake();
        $booking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $payload = $this->payload($booking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'][0]['ps_seat_number'] = '1b';

        $response = $this->postJson('/api/booking', $payload)->assertCreated();
        $createdPassenger = Passenger::where('booking_id', $response->json('data.booking_id'))->firstOrFail();
        $this->assertSame('1b', $createdPassenger->ps_seat_number);

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/seat-map?from_stop_id='.$stops[0]->route_stop_id.'&to_stop_id='.$stops[1]->route_stop_id)
            ->assertOk()
            ->assertJsonPath('data.seats.1.available', false);

        $this->postJson('/api/booking', $payload)->assertUnprocessable();
    }

    public function test_paid_booking_keeps_its_seat_reserved(): void
    {
        $booking = $this->makeBooking();
        Passenger::where('booking_id', $booking->booking_id)->firstOrFail()->update(['ps_seat_number' => '1B']);
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/seat-map?from_stop_id='.$stops[0]->route_stop_id.'&to_stop_id='.$stops[1]->route_stop_id)
            ->assertOk()
            ->assertJsonPath('data.seats.1.available', false);
    }

    public function test_economy_booking_has_no_numbered_seat(): void
    {
        Mail::fake();
        $booking = $this->makeBooking();
        $booking->availability->busUnit->busType->update([
            'bt_name' => 'ekonomi',
            'bt_use_seat_number' => false,
        ]);
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $payload = $this->payload($booking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'][0]['ps_seat_number'] = null;

        $response = $this->postJson('/api/booking', $payload)->assertCreated();
        $passenger = Passenger::where('booking_id', $response->json('data.booking_id'))->firstOrFail();
        $this->assertNull($passenger->ps_seat_number);
    }

    public function test_cancelled_booking_releases_its_seat_for_rebooking(): void
    {
        Mail::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        Passenger::where('booking_id', $booking->booking_id)->firstOrFail()->update(['ps_seat_number' => '1A']);
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson("/api/admin/booking/{$booking->booking_id}/cancel", ['reason' => 'Cancel pending test'])
            ->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled');

        $this->postJson('/api/booking', $this->payloadFor($booking, 0, 1))
            ->assertCreated();
    }

    public function test_expired_booking_releases_its_seat_for_rebooking(): void
    {
        Mail::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        Passenger::where('booking_id', $booking->booking_id)->firstOrFail()->update(['ps_seat_number' => '1A']);
        Booking::whereKey($booking->booking_id)->update(['bk_hold_until' => now()->subMinute()]);

        Artisan::call('bookings:release-expired-holds');

        $this->assertSame('expired', $booking->fresh()->bk_status);
        $this->postJson('/api/booking', $this->payloadFor($booking, 0, 1))
            ->assertCreated();
    }

    public function test_expired_pending_hold_is_released_before_scheduler_runs(): void
    {
        Mail::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        Passenger::where('booking_id', $booking->booking_id)->firstOrFail()->update(['ps_seat_number' => '1A']);
        Booking::whereKey($booking->booking_id)->update(['bk_hold_until' => now()->subMinute()]);
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();

        $this->getJson('/api/jadwal/'.$booking->availability_id.'/seat-map?from_stop_id='.$stops[0]->route_stop_id.'&to_stop_id='.$stops[1]->route_stop_id)
            ->assertOk()
            ->assertJsonPath('data.seats.0.available', true);

        $response = $this->postJson('/api/booking', $this->payloadFor($booking, 0, 1))
            ->assertCreated();

        $this->assertSame('expired', $booking->fresh()->bk_status);
        $this->assertSame('pending', Booking::findOrFail($response->json('data.booking_id'))->bk_status);
    }

    public function test_customer_can_release_pending_booking_using_code_and_email(): void
    {
        $booking = $this->makeBooking(['status' => 'pending']);

        $this->postJson('/api/booking/release-pending', [
            'bk_code' => $booking->bk_code,
            'email' => 'budi@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('data.bk_status', 'cancelled');

        $this->assertSame('cancelled', $booking->fresh()->bk_status);
        $this->assertSame(0, (int) AvailabilityLeg::where('availability_id', $booking->availability_id)->value('seats_booked'));
    }

    public function test_customer_cannot_release_a_non_pending_booking(): void
    {
        $booking = $this->makeBooking(['status' => 'paid']);

        $this->postJson('/api/booking/release-pending', [
            'bk_code' => $booking->bk_code,
            'email' => 'budi@example.com',
        ])->assertUnprocessable();

        $this->assertSame('paid', $booking->fresh()->bk_status);
    }

    public function test_same_seat_can_be_reused_on_non_overlapping_route_segments(): void
    {
        Mail::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        $this->appendRouteStop($booking);

        $this->postJson('/api/booking', $this->payloadFor($booking, 0, 1))->assertCreated();
        $this->postJson('/api/booking', $this->payloadFor($booking, 1, 2))
            ->assertCreated();
    }

    public function test_same_seat_is_rejected_on_overlapping_route_segments(): void
    {
        Mail::fake();
        $booking = $this->makeBooking(['status' => 'pending']);
        $this->appendRouteStop($booking);

        $this->postJson('/api/booking', $this->payloadFor($booking, 0, 1))->assertCreated();
        $this->postJson('/api/booking', $this->payloadFor($booking, 0, 2))
            ->assertUnprocessable();
    }

    public function test_infant_cannot_be_assigned_a_seat(): void
    {
        Mail::fake();
        $booking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $payload = $this->payload($booking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'][0]['ps_category'] = 'infant';
        $payload['passengers'][0]['ps_age'] = 0;
        $payload['passengers'][0]['ps_seat_number'] = '1A';

        $this->postJson('/api/booking', $payload)->assertUnprocessable();
    }

    public function test_passengers_in_a_booking_must_have_the_same_stops(): void
    {
        Mail::fake();
        $booking = $this->makeBooking();
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->orderBy('stop_order')
            ->get();
        $payload = $this->payload($booking->availability_id, $stops[0]->route_stop_id, $stops[1]->route_stop_id);
        $payload['passengers'][] = array_merge($payload['passengers'][0], ['ps_name' => 'Sari', 'ps_seat_number' => '1B']);
        $payload['passengers'][1]['from_stop_id'] = $stops[1]->route_stop_id;

        $this->postJson('/api/booking', $payload)->assertUnprocessable();
    }

    public function test_ticket_email_shows_assigned_and_unassigned_seats(): void
    {
        $booking = $this->makeBooking();
        $passengers = Passenger::where('booking_id', $booking->booking_id)->orderBy('passenger_id')->get();
        $passengers[0]->update(['ps_seat_number' => '1A']);

        $html = (new TicketMail($booking->fresh()))->render();

        $this->assertStringContainsString('KURSI', $html);
        $this->assertStringContainsString('1A', $html);
        $this->assertStringContainsString('Belum ditentukan', $html);
    }

    public function test_ticket_email_shows_free_seating_for_economy(): void
    {
        $booking = $this->makeBooking();
        $booking->availability->busUnit->busType->update(['bt_use_seat_number' => false]);

        $html = (new TicketMail($booking->fresh()))->render();

        $this->assertStringContainsString('Duduk bebas', $html);
    }

    public function test_ticket_email_shows_infants_do_not_receive_a_seat(): void
    {
        $booking = $this->makeBooking();
        Passenger::where('booking_id', $booking->booking_id)
            ->firstOrFail()
            ->update(['ps_category' => 'infant']);

        $html = (new TicketMail($booking->fresh()))->render();

        $this->assertStringContainsString('Tidak mendapat kursi', $html);
    }

    private function payload(int $availabilityId, int $fromStopId, int $toStopId): array
    {
        return [
            'contact' => [
                'ct_name' => 'Rizky',
                'ct_email' => 'rizky@example.com',
                'ct_phone' => '081234567890',
            ],
            'availability_id' => $availabilityId,
            'booking' => ['bk_notes' => null],
            'passengers' => [[
                'from_stop_id' => $fromStopId,
                'to_stop_id' => $toStopId,
                'ps_category' => 'adult',
                'ps_name' => 'Rizky',
                'ps_age' => 28,
                'ps_gender' => 'male',
                'ps_seat_number' => '1A',
            ]],
        ];
    }

    private function payloadFor(Booking $booking, int $fromOrder, int $toOrder): array
    {
        $stops = RouteStop::where('route_id', $booking->availability->route_id)
            ->whereIn('stop_order', [$fromOrder, $toOrder])
            ->get()
            ->keyBy('stop_order');
        $payload = $this->payload(
            $booking->availability_id,
            $stops->get($fromOrder)->route_stop_id,
            $stops->get($toOrder)->route_stop_id,
        );
        $payload['passengers'][0]['ps_name'] = 'Penumpang Baru';

        return $payload;
    }

    private function appendRouteStop(Booking $booking): RouteStop
    {
        $station = Station::create([
            'region_id' => $booking->availability->route->destinationStation->region_id,
            'stn_name' => 'terminal lanjutan',
            'stn_address' => 'Jl. Lanjutan',
        ]);
        $stop = RouteStop::create([
            'route_id' => $booking->availability->route_id,
            'station_id' => $station->station_id,
            'stop_order' => 2,
            'fare_adult' => 75000,
            'fare_child' => 50000,
            'fare_infant' => 0,
        ]);
        AvailabilityLeg::create([
            'availability_id' => $booking->availability_id,
            'route_stop_id' => $stop->route_stop_id,
            'seats_booked' => 0,
        ]);

        return $stop;
    }
}
