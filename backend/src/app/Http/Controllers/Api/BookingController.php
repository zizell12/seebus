<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->with(['availability.route.originStation.region', 'availability.route.destinationStation.region', 'contact', 'passengers.seat'])
            ->where('user_id', $request->user()->user_id)
            ->orderByDesc('created_at')
            ->get();

        $result = $bookings->map(function ($booking) {
            return [
                'booking_id' => $booking->booking_id,
                'booking_code' => $booking->bk_code,
                'status' => $booking->bk_status,
                'rute' => $booking->availability->route->originStation->region->rg_city . ' → ' . $booking->availability->route->destinationStation->region->rg_city,
                'tanggal' => $booking->availability->av_date->toDateString(),
                'jam' => substr($booking->availability->av_time, 0, 5),
                'total' => $booking->bk_total_price,
                'kontak' => $booking->contact,
                'penumpang' => $booking->passengers->map(fn ($p) => [
                    'nama' => $p->ps_name,
                    'kursi' => $p->seat?->seat_number,
                    'kategori' => $p->ps_category,
                ]),
            ];
        });

        return response()->json([
            'data' => $result,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contact' => 'nullable|array',
            'contact.ct_name' => 'nullable|string|max:100',
            'contact.ct_email' => 'nullable|email|max:100',
            'contact.ct_phone' => 'nullable|string|max:20',
            'contact.ct_nationality' => 'nullable|string|max:50',
            'availability_id' => 'required|exists:availability,availability_id',
            'user_id' => 'nullable|exists:user,user_id',
            'booking' => 'required|array',
            'booking.bk_notes' => 'nullable|string',
            'booking.bk_adult_count' => 'required|integer|min:0',
            'booking.bk_child_count' => 'required|integer|min:0',
            'booking.bk_infant_count' => 'required|integer|min:0',
            'booking.bk_net_price' => 'required|numeric|min:0',
            'booking.bk_publish_price' => 'required|numeric|min:0',
            'booking.bk_total_price' => 'required|numeric|min:0',
            'booking.bk_status' => 'nullable|in:pending,paid,expired,cancelled',
            'passengers' => 'required|array|min:1',
            'passengers.*.seat_id' => 'required',
            'passengers.*.ps_category' => 'required|in:adult,child,infant',
            'passengers.*.ps_name' => 'required|string|max:100',
            'passengers.*.ps_age' => 'required|integer|min:0',
            'passengers.*.ps_gender' => 'required|in:male,female',
            'passengers.*.ps_nationality' => 'nullable|string|max:50',
        ]);

        $seatIdentifiers = array_map(fn ($passenger) => $passenger['seat_id'], $data['passengers']);

        return DB::transaction(function () use ($data, $request, $seatIdentifiers) {
            $seats = Seat::where('availability_id', $data['availability_id'])
                ->where(function ($query) use ($seatIdentifiers) {
                    foreach ($seatIdentifiers as $identifier) {
                        if (is_numeric($identifier)) {
                            $query->orWhere('seat_id', $identifier);
                        } else {
                            $query->orWhere('seat_number', $identifier);
                        }
                    }
                })
                ->lockForUpdate()
                ->get();

            if ($seats->count() !== count(array_unique($seatIdentifiers))) {
                throw ValidationException::withMessages([
                    'passengers' => ['Beberapa kursi tidak valid untuk jadwal ini.'],
                ]);
            }

            $lockedSeats = $seats->filter(fn ($seat) => $seat->seat_status !== 'empty');
            if ($lockedSeats->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'passengers' => ['Beberapa kursi sudah dipesan atau terkunci.'],
                ]);
            }

            $seatIdByNumber = $seats->keyBy('seat_number');
            $seatIdById = $seats->keyBy('seat_id');

            $normalizedPassengers = array_map(function ($passenger) use ($seatIdByNumber, $seatIdById) {
                $identifier = $passenger['seat_id'];
                if (is_numeric($identifier) && $seatIdById->has((int) $identifier)) {
                    $seat = $seatIdById->get((int) $identifier);
                } elseif ($seatIdByNumber->has((string) $identifier)) {
                    $seat = $seatIdByNumber->get((string) $identifier);
                } else {
                    throw ValidationException::withMessages([
                        'passengers' => ['Beberapa kursi tidak valid untuk jadwal ini.'],
                    ]);
                }

                return [
                    'seat_id' => $seat->seat_id,
                    'ps_category' => $passenger['ps_category'],
                    'ps_name' => $passenger['ps_name'],
                    'ps_age' => $passenger['ps_age'],
                    'ps_gender' => $passenger['ps_gender'],
                    'ps_nationality' => $passenger['ps_nationality'] ?? 'Indonesia',
                ];
            }, $data['passengers']);

            $seatIds = array_unique(array_map(fn ($item) => $item['seat_id'], $normalizedPassengers));

            $contactName = $data['contact']['ct_name'] ?? ($data['passengers'][0]['ps_name'] ?? 'Customer');
            $contactEmail = $data['contact']['ct_email'] ?? ($data['passengers'][0]['ps_name'] ?? 'customer@example.com');
            $contactPhone = $data['contact']['ct_phone'] ?? '0000000000';

            $contact = Contact::create([
                'ct_name' => $contactName,
                'ct_email' => $contactEmail,
                'ct_phone' => $contactPhone,
                'ct_nationality' => $data['contact']['ct_nationality'] ?? 'Indonesia',
            ]);

            $userId = $data['user_id'] ?? ($request->user()?->user_id ?? null);

            $booking = Booking::create([
                'user_id' => $userId,
                'contact_id' => $contact->contact_id,
                'availability_id' => $data['availability_id'],
                'bk_adult_count' => $data['booking']['bk_adult_count'],
                'bk_child_count' => $data['booking']['bk_child_count'],
                'bk_infant_count' => $data['booking']['bk_infant_count'],
                'bk_notes' => $data['booking']['bk_notes'] ?? null,
                'bk_net_price' => $data['booking']['bk_net_price'],
                'bk_publish_price' => $data['booking']['bk_publish_price'],
                'bk_total_price' => $data['booking']['bk_total_price'],
                'bk_status' => 'pending',
            ]);

            foreach ($normalizedPassengers as $passenger) {
                $booking->passengers()->create([
                    'seat_id' => $passenger['seat_id'],
                    'ps_category' => $passenger['ps_category'],
                    'ps_name' => $passenger['ps_name'],
                    'ps_age' => $passenger['ps_age'],
                    'ps_gender' => $passenger['ps_gender'],
                    'ps_nationality' => $passenger['ps_nationality'] ?? 'Indonesia',
                ]);
            }

            $lockSession = "booking-{$booking->booking_id}";
            Seat::whereIn('seat_id', $seatIds)->update([
                'seat_status' => 'locked',
                'seat_locked_session' => $lockSession,
                'seat_locked_until' => Carbon::now()->addMinutes(15),
            ]);

            return response()->json([
                'message' => 'Booking berhasil dibuat.',
                'data' => [
                    'booking_id' => $booking->booking_id,
                    'booking_code' => $booking->bk_code,
                ],
            ], 201);
        });
    }
}
