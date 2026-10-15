<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Admin\AdminBookingController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BookingAdminListTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_list_returns_departure_date_and_time_in_jakarta(): void
    {
        config(['app.timezone' => 'Asia/Jakarta']);

        $regionId = DB::table('region')->insertGetId([
            'rg_district' => 'Setiabudi',
            'rg_city' => 'Jakarta Selatan',
            'rg_province' => 'DKI Jakarta',
        ]);
        $originStationId = DB::table('station')->insertGetId([
            'region_id' => $regionId,
            'stn_name' => 'Terminal Asal',
        ]);
        $destinationStationId = DB::table('station')->insertGetId([
            'region_id' => $regionId,
            'stn_name' => 'Terminal Tujuan',
        ]);
        $routeId = DB::table('route')->insertGetId([
            'origin_station_id' => $originStationId,
            'destination_station_id' => $destinationStationId,
        ]);
        $companyId = DB::table('company')->insertGetId(['co_name' => 'PO Test']);
        $busTypeId = DB::table('bus_type')->insertGetId([
            'company_id' => $companyId,
            'bt_name' => 'Ekonomi',
            'bt_capacity' => 40,
        ]);
        $busUnitId = DB::table('bus_unit')->insertGetId([
            'bus_type_id' => $busTypeId,
            'bu_code' => 'Unit Test',
            'bu_capacity' => 40,
            'bu_facilities' => json_encode([]),
            'is_active' => true,
        ]);
        $availabilityId = DB::table('availability')->insertGetId([
            'route_id' => $routeId,
            'bus_unit_id' => $busUnitId,
            'av_date' => '2026-10-20',
            'av_time' => '06:00:00',
            'av_price' => json_encode(['adult' => 100000]),
            'av_status' => 'active',
            'av_seats' => 40,
        ]);
        $contactId = DB::table('contact')->insertGetId([
            'ct_name' => 'Pelanggan Test',
            'ct_email' => 'test@example.com',
            'ct_phone' => '081234567890',
        ]);
        DB::table('booking')->insert([
            'bk_code' => 'SB-TEST2026',
            'availability_id' => $availabilityId,
            'contact_id' => $contactId,
            'bk_net_price' => 100000,
            'bk_publish_price' => 100000,
            'bk_total_price' => 100000,
            'bk_status' => 'pending',
        ]);

        $response = (new AdminBookingController())->index(Request::create('/api/admin/booking', 'GET'));
        $booking = $response->getData(true)['data'][0];

        $this->assertSame('2026-10-20', $booking['tanggal']);
        $this->assertSame('06:00', $booking['jam_berangkat']);
    }
}
