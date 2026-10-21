<?php

namespace Tests\Feature;

use App\Models\BusUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class AdminBusUnitUniqueTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_duplicate_code_and_plate_are_rejected_when_adding(): void
    {
        $booking = $this->makeBooking();
        $busUnit = $booking->availability->busUnit;
        $busUnit->update(['bu_plate_number' => 'N 1234 AB']);
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson('/api/admin/bus-unit', $this->payload($busUnit, $busUnit->bu_code, 'N 9999 ZZ'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bu_code')
            ->assertJsonFragment(['bu_code' => ['Kode armada sudah dipakai.']]);

        $this->postJson('/api/admin/bus-unit', $this->payload($busUnit, 'kode-baru', 'N 1234 AB'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bu_plate_number')
            ->assertJsonFragment(['bu_plate_number' => ['Plat nomor sudah dipakai.']]);
    }

    public function test_duplicate_code_and_plate_are_rejected_when_editing_other_unit(): void
    {
        $booking = $this->makeBooking();
        $busUnit = $booking->availability->busUnit;
        $busUnit->update(['bu_plate_number' => 'N 1234 AB']);
        $otherBusUnit = BusUnit::create([
            'bus_type_id' => $busUnit->bus_type_id,
            'bu_code' => 'kode-unit-kedua',
            'bu_plate_number' => 'B 1234 CD',
            'bu_capacity' => 32,
            'is_active' => true,
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->putJson('/api/admin/bus-unit/'.$otherBusUnit->bus_unit_id, $this->payload($otherBusUnit, $busUnit->bu_code, 'B 9999 ZZ'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bu_code');

        $this->putJson('/api/admin/bus-unit/'.$otherBusUnit->bus_unit_id, $this->payload($otherBusUnit, 'kode-unit-kedua', 'N 1234 AB'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bu_plate_number');
    }

    public function test_editing_own_code_and_normalizing_plate_are_allowed(): void
    {
        $booking = $this->makeBooking();
        $busUnit = $booking->availability->busUnit;
        Sanctum::actingAs($this->makeAdmin());

        $this->putJson('/api/admin/bus-unit/'.$busUnit->bus_unit_id, $this->payload($busUnit, $busUnit->bu_code, '  ab   123  '))
            ->assertOk()
            ->assertJsonPath('data.bu_code', $busUnit->bu_code)
            ->assertJsonPath('data.bu_plate_number', 'AB 123');
    }

    private function payload(BusUnit $busUnit, string $code, ?string $plate): array
    {
        return [
            'bus_type_id' => $busUnit->bus_type_id,
            'bu_code' => $code,
            'bu_plate_number' => $plate,
            'bu_capacity' => $busUnit->bu_capacity,
            'bu_facilities' => [],
            'is_active' => true,
        ];
    }
}
