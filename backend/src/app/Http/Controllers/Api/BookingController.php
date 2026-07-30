<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
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
    // Komisi platform: bagian yang "ditahan" SeeBus, sisanya (net price) yang
    // diteruskan ke PO bus. Biaya layanan ditambahkan di atas harga publish
    // supaya bk_net_price, bk_publish_price, dan bk_total_price benar-benar
    // tiga angka yang berbeda (bukan cuma disalin dari satu nilai yang sama).
    private const KOMISI_PLATFORM = 0.10; // 10%
    private const BIAYA_LAYANAN = 5000; // Rp, flat per booking

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
            'booking.bk_status' => 'nullable|in:pending,paid,expired,cancelled',
            'passengers' => 'required|array|min:1',
            'passengers.*.seat_id' => 'required',
            'passengers.*.ps_category' => 'required|in:adult,child,infant',
            'passengers.*.ps_name' => 'required|string|max:100',
            'passengers.*.ps_age' => 'required|integer|min:0',
            'passengers.*.ps_gender' => 'required|in:male,female',
            'passengers.*.ps_nationality' => 'nullable|string|max:50',
            'session_id' => 'nullable|string|max:100',
        ]);

        $seatIdentifiers = array_map(fn ($passenger) => $passenger['seat_id'], $data['passengers']);

        return DB::transaction(function () use ($data, $request, $seatIdentifiers) {
            $availability = Availability::findOrFail($data['availability_id']);

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

            // Kursi dianggap TIDAK tersedia hanya jika:
            // - sudah 'booked' (final, tidak pernah lepas sendiri), atau
            // - 'locked' DAN lock-nya masih berlaku (seat_locked_until belum lewat).
            // Kursi 'locked' yang seat_locked_until-nya sudah lewat waktu (misal booking
            // sebelumnya ditinggalkan tanpa lanjut bayar) dianggap tersedia lagi, supaya
            // kursi tidak "terkunci selamanya" gara-gara tidak ada proses pembersihan lock.
            $sessionId = $data['session_id'] ?? null;

            $tidakTersedia = $seats->filter(function ($seat) use ($sessionId) {
                if ($seat->seat_status === 'booked') {
                    return true;
                }

                if ($seat->seat_status !== 'locked') {
                    return false;
                }

                $lockMasihBerlaku = $seat->seat_locked_until !== null && $seat->seat_locked_until->isFuture();
                if (! $lockMasihBerlaku) {
                    return false;
                }

                // Locked, masih berlaku, dan session_id-nya sama dengan yang barusan
                // mengunci kursi ini sendiri (lewat /kursi/lock saat konfirmasi di
                // SeatPickerModal) -> boleh lanjut, bukan konflik dengan orang lain.
                return $seat->seat_locked_session !== $sessionId;
            });
            if ($tidakTersedia->isNotEmpty()) {
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
            $contactEmail = $data['contact']['ct_email'] ?? 'customer@example.com';
            $contactPhone = $data['contact']['ct_phone'] ?? '0000000000';

            $contact = Contact::create([
                'ct_name' => $contactName,
                'ct_email' => $contactEmail,
                'ct_phone' => $contactPhone,
                'ct_nationality' => $data['contact']['ct_nationality'] ?? 'Indonesia',
            ]);

            $userId = $data['user_id'] ?? ($request->user()?->user_id ?? null);

            // Harga dihitung dari av_price milik jadwal (Availability) yang
            // tersimpan di database, BUKAN dari angka yang dikirim frontend.
            // Ini memastikan harga yang tampil ke customer & yang dikelola
            // admin di panel jadwal selalu sinkron (sama-sama dari av_price),
            // dan bayi (infant) tidak dikenakan biaya kursi.
            $hargaDewasa = (float) ($availability->av_price['adult'] ?? 0);
            $hargaAnak = (float) ($availability->av_price['child'] ?? $hargaDewasa);

            $publishPrice = ($data['booking']['bk_adult_count'] * $hargaDewasa)
                + ($data['booking']['bk_child_count'] * $hargaAnak);
            $netPrice = round($publishPrice * (1 - self::KOMISI_PLATFORM));
            $totalPrice = $publishPrice + self::BIAYA_LAYANAN;

            $booking = Booking::create([
                'user_id' => $userId,
                'contact_id' => $contact->contact_id,
                'availability_id' => $data['availability_id'],
                'bk_adult_count' => $data['booking']['bk_adult_count'],
                'bk_child_count' => $data['booking']['bk_child_count'],
                'bk_infant_count' => $data['booking']['bk_infant_count'],
                'bk_notes' => $data['booking']['bk_notes'] ?? null,
                'bk_net_price' => $netPrice,
                'bk_publish_price' => $publishPrice,
                'bk_total_price' => $totalPrice,
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
                    'bk_net_price' => $netPrice,
                    'bk_publish_price' => $publishPrice,
                    'bk_total_price' => $totalPrice,
                    'biaya_layanan' => self::BIAYA_LAYANAN,
                ],
            ], 201);
        });
    }
}