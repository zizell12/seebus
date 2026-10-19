<?php

namespace Tests\Concerns;

use App\Models\Availability;
use App\Models\AvailabilityLeg;
use App\Models\Booking;
use App\Models\BusType;
use App\Models\BusUnit;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Passenger;
use App\Models\Region;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\Station;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Data uji sederhana: satu rute dua titik (1 etape), satu jadwal, satu booking
 * berisi 2 penumpang dewasa. Total Rp150.000 / USD 10.00 supaya hitungan
 * refund gampang diperiksa (75% = Rp112.500 / USD 7.50).
 */
trait BuildsBookingFixtures
{
    protected function tz(): string
    {
        return config('app.timezone');
    }

    protected function makeAdmin(): User
    {
        return User::firstOrCreate(
            ['usr_email' => 'admin-uji@example.com'],
            ['usr_name' => 'Admin Uji', 'usr_password_hash' => bcrypt('secret-uji'), 'usr_role' => 'admin'],
        );
    }

    /**
     * @param  array{departure?:Carbon, status?:string, hold_until?:Carbon|null, with_capture?:bool, seats?:int}  $o
     */
    protected function makeBooking(array $o = []): Booking
    {
        $departure = $o['departure'] ?? Carbon::now($this->tz())->addDays(3);
        $status = $o['status'] ?? 'paid';
        $seats = $o['seats'] ?? 2;

        // Struktur tetap (wilayah, terminal, rute, armada) dipakai ulang kalau
        // makeBooking() dipanggil lebih dari sekali dalam satu test.
        $regionA = Region::firstOrCreate(['rg_district' => 'Jember', 'rg_city' => 'Jember', 'rg_province' => 'Jawa Timur']);
        $regionB = Region::firstOrCreate(['rg_district' => 'Surabaya', 'rg_city' => 'Surabaya', 'rg_province' => 'Jawa Timur']);
        $stationA = Station::firstOrCreate(['region_id' => $regionA->region_id, 'stn_name' => 'terminal jember'], ['stn_address' => 'Jl. A']);
        $stationB = Station::firstOrCreate(['region_id' => $regionB->region_id, 'stn_name' => 'terminal surabaya'], ['stn_address' => 'Jl. B']);
        $route = Route::firstOrCreate(
            ['origin_station_id' => $stationA->station_id, 'destination_station_id' => $stationB->station_id],
            ['rt_distance_km' => 200, 'rt_duration_min' => 300],
        );

        $stopA = RouteStop::firstOrCreate(['route_id' => $route->route_id, 'stop_order' => 0], ['station_id' => $stationA->station_id]);
        $stopB = RouteStop::firstOrCreate(['route_id' => $route->route_id, 'stop_order' => 1], [
            'station_id' => $stationB->station_id,
            'offset_minutes' => 300, 'fare_adult' => 75000, 'fare_child' => 50000, 'fare_infant' => 0,
        ]);

        $company = Company::firstOrCreate(['co_name' => 'po uji'], ['co_address' => 'Jl. Uji', 'co_phone' => '0811', 'co_email' => 'po@example.com']);
        $busType = BusType::firstOrCreate(
            ['company_id' => $company->company_id, 'bt_name' => 'eksekutif'],
            ['bt_capacity' => 32, 'bt_use_seat_number' => true, 'bt_seat_pattern' => '2-2'],
        );
        $busUnit = BusUnit::firstOrCreate(['bus_type_id' => $busType->bus_type_id, 'bu_code' => 'uji unit 1'], ['bu_capacity' => 32, 'is_active' => true]);

        $availability = Availability::create([
            'route_id' => $route->route_id,
            'bus_unit_id' => $busUnit->bus_unit_id,
            'av_date' => $departure->toDateString(),
            'av_time' => $departure->format('H:i:s'),
            'av_price' => ['adult' => 75000, 'child' => 50000, 'infant' => 0],
            'av_status' => 'active',
            'av_seats' => 32,
        ]);

        AvailabilityLeg::create([
            'availability_id' => $availability->availability_id,
            'route_stop_id' => $stopB->route_stop_id,
            'seats_booked' => $seats,
        ]);

        $contact = Contact::create(['ct_name' => 'Budi Uji', 'ct_email' => 'budi@example.com', 'ct_phone' => '0812345678']);

        $paid = $status === 'paid' || $status === 'cancelled';
        $withCapture = $o['with_capture'] ?? true;

        $booking = Booking::create([
            'availability_id' => $availability->availability_id,
            'contact_id' => $contact->contact_id,
            'bk_adult_count' => 2,
            'bk_child_count' => 0,
            'bk_infant_count' => 0,
            'bk_net_price' => 130000,
            'bk_publish_price' => 140000,
            'bk_total_price' => 150000,
            'bk_status' => $status,
            'bk_hold_until' => array_key_exists('hold_until', $o)
                ? $o['hold_until']
                : ($status === 'pending' ? now()->addMinutes(30) : null),
            'bk_paid_at' => $paid ? now() : null,
            'bk_paypal_order_id' => $paid ? 'ORDER-1' : null,
            'bk_paypal_capture_id' => $paid && $withCapture ? 'CAP-1' : null,
            'bk_paid_usd' => $paid && $withCapture ? '10.00' : null,
        ]);

        foreach (['Budi', 'Sari'] as $nama) {
            Passenger::create([
                'booking_id' => $booking->booking_id,
                'from_stop_id' => $stopA->route_stop_id,
                'to_stop_id' => $stopB->route_stop_id,
                'ps_category' => 'adult',
                'ps_name' => $nama,
                'ps_age' => 30,
                'ps_gender' => 'male',
            ]);
        }

        return $booking;
    }

    protected function seatsBooked(Booking $booking): int
    {
        return (int) AvailabilityLeg::where('availability_id', $booking->availability_id)->value('seats_booked');
    }
}
