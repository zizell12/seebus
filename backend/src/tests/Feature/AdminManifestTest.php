<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Passenger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminManifestTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_manifest_lists_paid_passengers_with_booking_and_stop_details(): void
    {
        $booking = $this->makeBooking();
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/manifest/'.$booking->availability_id)
            ->assertOk()
            ->assertJsonPath('data.penumpang.0.bk_code', $booking->bk_code)
            ->assertJsonPath('data.penumpang.0.ps_name', 'Budi')
            ->assertJsonPath('data.penumpang.0.naik_dari', 'terminal jember')
            ->assertJsonPath('data.penumpang.0.turun_di', 'terminal surabaya')
            ->assertJsonPath('data.penumpang.0.label_kursi', 'Belum ditentukan')
            ->assertJsonPath('data.ringkasan_titik.0.jumlah_naik', 2)
            ->assertJsonPath('data.ringkasan_titik.1.jumlah_turun', 2)
            ->assertJsonCount(2, 'data.penumpang');
    }

    public function test_manifest_excludes_non_paid_bookings(): void
    {
        $booking = $this->makeBooking();
        Booking::whereKey($booking->booking_id)->update(['bk_status' => 'pending']);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/manifest/'.$booking->availability_id)
            ->assertOk()
            ->assertJsonCount(0, 'data.penumpang');
    }

    public function test_manifest_csv_is_admin_only_and_contains_stop_summary_and_seat_label(): void
    {
        $booking = $this->makeBooking();
        Sanctum::actingAs($this->makeAdmin());

        $response = $this->get('/api/admin/manifest/'.$booking->availability_id.'/csv');
        $response->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Ringkasan titik', $response->streamedContent());
        $this->assertStringContainsString('Belum ditentukan', $response->streamedContent());
    }

    public function test_manifest_csv_requires_admin_authentication(): void
    {
        $booking = $this->makeBooking();

        $this->getJson('/api/admin/manifest/'.$booking->availability_id.'/csv')
            ->assertUnauthorized();
    }

    public function test_economy_manifest_marks_seats_as_free_seating(): void
    {
        $booking = $this->makeBooking();
        $booking->availability->busUnit->busType->update(['bt_use_seat_number' => false]);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/manifest/'.$booking->availability_id)
            ->assertOk()
            ->assertJsonPath('data.penumpang.0.label_kursi', 'Bebas');
    }

    public function test_manifest_marks_infants_as_not_receiving_a_seat(): void
    {
        $booking = $this->makeBooking();
        Passenger::where('booking_id', $booking->booking_id)
            ->firstOrFail()
            ->update(['ps_category' => 'infant']);
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/manifest/'.$booking->availability_id)
            ->assertOk()
            ->assertJsonPath('data.penumpang.0.label_kursi', 'Tidak mendapat kursi');
    }
}
