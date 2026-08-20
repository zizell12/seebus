<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\BookingPendingMail;
use App\Models\Availability;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

        [$booking, $responseData] = DB::transaction(function () use ($data, $request, $seatIdentifiers) {
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

            // user_id SENGAJA tidak diambil dari body request (client bisa kirim
            // user_id siapa saja yang valid dan booking itu akan "ditempelkan"
            // ke akun orang lain tanpa verifikasi apapun). Satu-satunya sumber
            // yang bisa dipercaya adalah user yang benar-benar sedang login
            // lewat token Sanctum-nya sendiri. Kalau tidak login (guest), tetap
            // null seperti sebelumnya.
            $userId = $request->user()?->user_id;

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

            return [$booking, [
                'message' => 'Booking berhasil dibuat.',
                'data' => [
                    'booking_id' => $booking->booking_id,
                    'booking_code' => $booking->bk_code,
                    'bk_net_price' => $netPrice,
                    'bk_publish_price' => $publishPrice,
                    'bk_total_price' => $totalPrice,
                    'biaya_layanan' => self::BIAYA_LAYANAN,
                ],
            ]];
        });

        // Kirim email berisi kode booking + link "Lanjutkan Pembayaran" SEGERA
        // setelah booking dibuat (bukan cuma diselipkan di response API yang
        // tidak pernah ditampilkan lagi di UI manapun). Ini satu-satunya cara
        // customer yang tidak sempat mencatat kode bookingnya tetap punya
        // jalan untuk melanjutkan pembayaran nanti. Dikirim di luar transaksi
        // DB dan dibungkus try/catch supaya kegagalan kirim email (mis. SMTP
        // down) tidak sampai menggagalkan booking yang sudah tersimpan.
        $recipientEmail = $booking->contact?->ct_email;
        if ($recipientEmail && $recipientEmail !== 'customer@example.com') {
            try {
                Mail::to($recipientEmail)->send(new BookingPendingMail($booking));
            } catch (\Throwable $e) {
                Log::error('Gagal mengirim email konfirmasi booking pending', [
                    'booking_id' => $booking->booking_id,
                    'email' => $recipientEmail,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json($responseData, 201);
    }

    /**
     * POST /api/booking/lookup
     *
     * Dipakai halaman "Lanjutkan Pembayaran": karena data booking di frontend
     * cuma hidup di BookingContext (React state di memori, hilang begitu tab
     * ditutup/direfresh) dan sebelumnya TIDAK ADA endpoint sama sekali untuk
     * mengambil ulang booking yang sudah dibuat, customer yang pembayarannya
     * masih pending lalu meninggalkan halaman Pembayaran (refresh, salah
     * pencet back, sinyal putus, dsb) tidak punya cara untuk melanjutkan
     * pembayaran tersebut dari sisi aplikasi.
     *
     * Butuh bk_code (kode booking, dikirim ke customer) DAN email kontak
     * sekaligus (bukan cuma salah satu) supaya kode booking yang cukup
     * pendek (8 karakter) tidak bisa ditebak/di-brute-force begitu saja
     * untuk mengintip data booking orang lain. Endpoint ini juga dibatasi
     * rate limit lewat middleware 'throttle' di routes/api.php.
     */
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bk_code' => 'required|string|max:20',
            'email' => 'required|email|max:100',
        ]);

        $booking = Booking::with([
            'contact',
            'passengers.seat',
            'availability.route.originStation.region',
            'availability.route.destinationStation.region',
            'availability.busType.company',
        ])
            ->where('bk_code', strtoupper(trim($data['bk_code'])))
            ->whereHas('contact', function ($q) use ($data) {
                $q->whereRaw('LOWER(ct_email) = ?', [strtolower($data['email'])]);
            })
            ->first();

        if (! $booking) {
            return response()->json([
                'message' => 'Booking tidak ditemukan. Periksa kembali kode booking dan email Anda.',
            ], 404);
        }

        $availability = $booking->availability;
        $seatLockedUntil = $booking->passengers
            ->pluck('seat.seat_locked_until')
            ->filter()
            ->min();

        return response()->json([
            'data' => [
                'booking_id' => $booking->booking_id,
                'bk_code' => $booking->bk_code,
                'bk_status' => $booking->bk_status,
                'bk_publish_price' => (float) $booking->bk_publish_price,
                'bk_total_price' => (float) $booking->bk_total_price,
                'biaya_layanan' => (float) $booking->bk_total_price - (float) $booking->bk_publish_price,
                'expires_at' => $seatLockedUntil,
                'jadwal' => $availability ? [
                    'availability_id' => $availability->availability_id,
                    'dari' => $availability->route?->originStation?->stn_name,
                    'tujuan' => $availability->route?->destinationStation?->stn_name,
                    'tanggal' => optional($availability->av_date)->toDateString(),
                    'jam_berangkat' => substr((string) $availability->av_time, 0, 5),
                    'kelas' => $availability->busType?->bt_name,
                ] : null,
                'kursi' => $booking->passengers->pluck('seat.seat_number')->filter()->values(),
                'passengers' => $booking->passengers->map(fn ($p) => [
                    'ps_name' => $p->ps_name,
                    'ps_category' => $p->ps_category,
                    'ps_age' => $p->ps_age,
                    'ps_gender' => $p->ps_gender,
                    'ps_nationality' => $p->ps_nationality,
                    'seat_number' => $p->seat?->seat_number,
                ]),
                'contact' => [
                    'ct_name' => $booking->contact?->ct_name,
                    'ct_email' => $booking->contact?->ct_email,
                    'ct_phone' => $booking->contact?->ct_phone,
                    'ct_nationality' => $booking->contact?->ct_nationality,
                ],
            ],
        ]);
    }
}