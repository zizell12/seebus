<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\BusType;
use App\Models\Company;
use App\Models\Region;
use App\Models\Route;
use App\Models\Seat;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_endpoint_can_create_booking(): void
    {
        $regionFrom = Region::create([
            'rg_district' => 'Jember',
            'rg_city' => 'Jember',
            'rg_province' => 'Jawa Timur',
        ]);

        $regionTo = Region::create([
            'rg_district' => 'Surabaya',
            'rg_city' => 'Surabaya',
            'rg_province' => 'Jawa Timur',
        ]);

        $stationFrom = Station::create([
            'region_id' => $regionFrom->region_id,
            'stn_name' => 'Terminal Jember',
            'stn_address' => 'Jl. Jember',
        ]);

        $stationTo = Station::create([
            'region_id' => $regionTo->region_id,
            'stn_name' => 'Terminal Surabaya',
            'stn_address' => 'Jl. Surabaya',
        ]);

        $route = Route::create([
            'origin_station_id' => $stationFrom->station_id,
            'destination_station_id' => $stationTo->station_id,
            'rt_distance_km' => 180,
            'rt_duration_min' => 300,
        ]);

        $company = Company::create([
            'co_name' => 'Test Company',
            'co_address' => 'Jl. Test',
            'co_phone' => '08123456789',
            'co_email' => 'test@example.com',
        ]);

        $busType = BusType::create([
            'company_id' => $company->company_id,
            'bt_name' => 'Ekonomi',
            'bt_capacity' => 32,
            'bt_facilities' => 'AC, Kursi Standar',
        ]);

        $availability = Availability::create([
            'route_id' => $route->route_id,
            'bus_type_id' => $busType->bus_type_id,
            'av_date' => '2026-07-20',
            'av_time' => '06:00:00',
            'av_price' => json_encode(['adult' => 120000, 'child' => 90000]),
            'av_status' => 'active',
            'av_seats' => 32,
        ]);

        $seat = Seat::create([
            'availability_id' => $availability->availability_id,
            'seat_number' => 'A1',
            'seat_status' => 'empty',
            'seat_locked_session' => null,
            'seat_locked_until' => null,
        ]);

        $response = $this->postJson('/api/booking', [
            'contact' => [
                'ct_name' => 'Rizky',
                'ct_email' => 'rizky@example.com',
                'ct_phone' => '081234567890',
                'ct_nationality' => 'Indonesia',
            ],
            'availability_id' => $availability->availability_id,
            'user_id' => null,
            'booking' => [
                'bk_notes' => 'Jaga kursi 1',
                'bk_adult_count' => 1,
                'bk_child_count' => 0,
                'bk_infant_count' => 0,
                'bk_net_price' => 120000,
                'bk_publish_price' => 120000,
                'bk_total_price' => 120000,
                'bk_status' => 'pending',
            ],
            'passengers' => [
                [
                    'seat_id' => $seat->seat_id,
                    'ps_category' => 'adult',
                    'ps_name' => 'Rizky',
                    'ps_age' => 28,
                    'ps_gender' => 'male',
                    'ps_nationality' => 'Indonesia',
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Booking berhasil dibuat.')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'booking_code',
                    'booking_id',
                ],
            ]);
    }
}
