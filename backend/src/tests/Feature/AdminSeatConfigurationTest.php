<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminSeatConfigurationTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_bus_capacity_cannot_change_while_a_future_booking_uses_it(): void
    {
        $booking = $this->makeBooking(['status' => 'pending']);
        Sanctum::actingAs($this->makeAdmin());
        $unit = $booking->availability->busUnit;

        $this->putJson("/api/admin/bus-unit/{$unit->bus_unit_id}", [
            'bus_type_id' => $unit->bus_type_id,
            'bu_code' => $unit->bu_code,
            'bu_plate_number' => $unit->bu_plate_number,
            'bu_capacity' => $unit->bu_capacity - 1,
            'bu_facilities' => $unit->bu_facilities ?? [],
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Kapasitas armada tidak dapat diubah karena memiliki jadwal mendatang dengan booking pending atau paid.');

        $this->assertSame(32, (int) $unit->fresh()->bu_capacity);
    }

    public function test_bus_type_seat_flag_and_pattern_cannot_change_with_future_bookings(): void
    {
        $booking = $this->makeBooking(['status' => 'paid']);
        Sanctum::actingAs($this->makeAdmin());
        $busType = $booking->availability->busUnit->busType;

        $this->putJson("/api/admin/bus-type/{$busType->bus_type_id}", [
            'company_id' => $busType->company_id,
            'bt_name' => $busType->bt_name,
            'bt_use_seat_number' => true,
            'bt_seat_pattern' => '1-2',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Pengaturan nomor/pola kursi tidak dapat diubah karena kelas ini dipakai jadwal mendatang yang memiliki booking pending atau paid.');

        $this->assertSame('2-2', $busType->fresh()->bt_seat_pattern);
    }

    public function test_expired_pending_hold_does_not_block_bus_capacity_change(): void
    {
        $booking = $this->makeBooking(['status' => 'pending']);
        $booking->update(['bk_hold_until' => now()->subMinute()]);
        Sanctum::actingAs($this->makeAdmin());
        $unit = $booking->availability->busUnit;

        $this->putJson("/api/admin/bus-unit/{$unit->bus_unit_id}", [
            'bus_type_id' => $unit->bus_type_id,
            'bu_code' => $unit->bu_code,
            'bu_plate_number' => $unit->bu_plate_number,
            'bu_capacity' => $unit->bu_capacity - 1,
            'bu_facilities' => $unit->bu_facilities ?? [],
        ])->assertOk();

        $this->assertSame(31, (int) $unit->fresh()->bu_capacity);
    }

    public function test_expired_pending_hold_does_not_block_seat_configuration_change(): void
    {
        $booking = $this->makeBooking(['status' => 'pending']);
        $booking->update(['bk_hold_until' => now()->subMinute()]);
        Sanctum::actingAs($this->makeAdmin());
        $busType = $booking->availability->busUnit->busType;

        $this->putJson("/api/admin/bus-type/{$busType->bus_type_id}", [
            'company_id' => $busType->company_id,
            'bt_name' => $busType->bt_name,
            'bt_use_seat_number' => false,
            'bt_seat_pattern' => '1-2',
        ])->assertOk();

        $this->assertFalse((bool) $busType->fresh()->bt_use_seat_number);
        $this->assertSame('1-2', $busType->fresh()->bt_seat_pattern);
    }
}
