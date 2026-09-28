<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\BookingPendingMail;
use App\Models\Availability;
use App\Models\AvailabilityLeg;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\RouteStop;
use App\Services\RouteFareCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    private const KOMISI_PLATFORM = 0.10; // 10%
    private const BIAYA_LAYANAN = 5000; // Rp, flat per booking
    private const HOLD_MINUTES = 15;

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
            'passengers' => 'required|array|min:1',
            'passengers.*.from_stop_id' => 'required|integer|exists:route_stop,route_stop_id',
            'passengers.*.to_stop_id' => 'required|integer|exists:route_stop,route_stop_id',
            'passengers.*.ps_category' => 'required|in:adult,child,infant',
            'passengers.*.ps_name' => 'required|string|max:100',
            'passengers.*.ps_age' => 'required|integer|min:0',
            'passengers.*.ps_gender' => 'required|in:male,female',
            'passengers.*.ps_nationality' => 'nullable|string|max:50',
        ]);

        [$booking, $responseData] = DB::transaction(function () use ($data, $request) {
            $availability = Availability::findOrFail($data['availability_id']);

            // Kunci semua baris availability_leg milik jadwal ini SEKARANG,
            // sebelum baca angka seats_booked-nya -- supaya kalau ada 2 orang
            // booking bersamaan buat etape yang sama, yang kedua nunggu
            // sampai yang pertama selesai, bukan baca angka yang sama-sama
            // "lum ke-update" (race condition).
            $legs = AvailabilityLeg::where('availability_id', $availability->availability_id)
                ->lockForUpdate()
                ->get()
                ->keyBy('route_stop_id');

            $stopIds = collect($data['passengers'])
                ->flatMap(fn ($p) => [$p['from_stop_id'], $p['to_stop_id']])
                ->unique();

            $stops = RouteStop::whereIn('route_stop_id', $stopIds)
                ->where('route_id', $availability->route_id)
                ->get()
                ->keyBy('route_stop_id');

            if ($stops->count() !== $stopIds->count()) {
                throw ValidationException::withMessages([
                    'passengers' => ['Ada titik naik/turun yang tidak valid untuk rute jadwal ini.'],
                ]);
            }

            // Hitung, per penumpang: etape mana aja yang dia lewatin + harga
            // sesuai kategorinya (dewasa/anak/bayi).
            $normalizedPassengers = [];
            $tambahanPerEtape = []; // route_stop_id (etape) => jumlah kursi baru yang mau dipakai
            $totalHarga = 0;

            foreach ($data['passengers'] as $passenger) {
                $from = $stops->get($passenger['from_stop_id']);
                $to = $stops->get($passenger['to_stop_id']);

                if ($from->stop_order >= $to->stop_order) {
                    throw ValidationException::withMessages([
                        'passengers' => ['Titik turun harus berada setelah titik naik.'],
                    ]);
                }

                $etapeDilewati = RouteFareCalculator::legsBetween($from, $to);

                // Bayi (infant) umumnya duduk di pangkuan, tidak makan kursi --
                // jadi tidak ikut mengurangi stok, cuma dewasa & anak yang dihitung.
                if ($passenger['ps_category'] !== 'infant') {
                    foreach ($etapeDilewati as $etape) {
                        $tambahanPerEtape[$etape->route_stop_id] = ($tambahanPerEtape[$etape->route_stop_id] ?? 0) + 1;
                    }
                }

                $harga = RouteFareCalculator::calculate($from, $to);
                $hargaPenumpang = (float) ($harga[$passenger['ps_category']] ?? 0);
                $totalHarga += $hargaPenumpang;

                $normalizedPassengers[] = array_merge($passenger, ['harga' => $hargaPenumpang]);
            }

            // Cek stok: buat tiap etape yang kepakai, pastikan
            // (yang sudah kepesan + yang mau ditambah) tidak melebihi kapasitas.
            foreach ($tambahanPerEtape as $routeStopId => $tambahan) {
                $leg = $legs->get($routeStopId);
                $sisaStok = $availability->av_seats - ($leg->seats_booked ?? 0);

                if ($tambahan > $sisaStok) {
                    $namaTitik = $stops->get($routeStopId)?->station?->stn_name ?? "etape #{$routeStopId}";

                    throw ValidationException::withMessages([
                        'passengers' => ["Stok kursi tidak cukup di etape menuju {$namaTitik}. Sisa {$sisaStok} kursi."],
                    ]);
                }
            }

            // Semua etape aman -- kurangi stoknya sekarang.
            foreach ($tambahanPerEtape as $routeStopId => $tambahan) {
                AvailabilityLeg::where('availability_id', $availability->availability_id)
                    ->where('route_stop_id', $routeStopId)
                    ->increment('seats_booked', $tambahan);
            }

            $contactName = $data['contact']['ct_name'] ?? ($data['passengers'][0]['ps_name'] ?? 'Customer');
            $contactEmail = $data['contact']['ct_email'] ?? 'customer@example.com';
            $contactPhone = $data['contact']['ct_phone'] ?? '0000000000';

            $contact = Contact::create([
                'ct_name' => $contactName,
                'ct_email' => $contactEmail,
                'ct_phone' => $contactPhone,
                'ct_nationality' => $data['contact']['ct_nationality'] ?? 'Indonesia',
            ]);

            $userId = $request->user()?->user_id;

            $bkAdultCount = collect($data['passengers'])->where('ps_category', 'adult')->count();
            $bkChildCount = collect($data['passengers'])->where('ps_category', 'child')->count();
            $bkInfantCount = collect($data['passengers'])->where('ps_category', 'infant')->count();

            $publishPrice = $totalHarga;
            $netPrice = round($publishPrice * (1 - self::KOMISI_PLATFORM));
            $totalPrice = $publishPrice + self::BIAYA_LAYANAN;

            $booking = Booking::create([
                'user_id' => $userId,
                'contact_id' => $contact->contact_id,
                'availability_id' => $data['availability_id'],
                'bk_adult_count' => $bkAdultCount,
                'bk_child_count' => $bkChildCount,
                'bk_infant_count' => $bkInfantCount,
                'bk_notes' => $data['booking']['bk_notes'] ?? null,
                'bk_net_price' => $netPrice,
                'bk_publish_price' => $publishPrice,
                'bk_total_price' => $totalPrice,
                'bk_status' => 'pending',
                'bk_hold_until' => now()->addMinutes(self::HOLD_MINUTES),
            ]);

            foreach ($normalizedPassengers as $passenger) {
                $booking->passengers()->create([
                    'from_stop_id' => $passenger['from_stop_id'],
                    'to_stop_id' => $passenger['to_stop_id'],
                    'ps_category' => $passenger['ps_category'],
                    'ps_name' => $passenger['ps_name'],
                    'ps_age' => $passenger['ps_age'],
                    'ps_gender' => $passenger['ps_gender'],
                    'ps_nationality' => $passenger['ps_nationality'] ?? 'Indonesia',
                ]);
            }

            return [$booking, [
                'message' => 'Booking berhasil dibuat.',
                'data' => [
                    'booking_id' => $booking->booking_id,
                    'booking_code' => $booking->bk_code,
                    'bk_net_price' => $netPrice,
                    'bk_publish_price' => $publishPrice,
                    'bk_total_price' => $totalPrice,
                    'biaya_layanan' => self::BIAYA_LAYANAN,
                    'berlaku_sampai' => $booking->bk_hold_until,
                ],
            ]];
        });

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

    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bk_code' => 'required|string|max:20',
            'email' => 'required|email|max:100',
        ]);

        $booking = Booking::with([
            'contact',
            'passengers.fromStop.station',
            'passengers.toStop.station',
            'availability.route.originStation.region',
            'availability.route.destinationStation.region',
            'availability.busUnit.busType.company',
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

        return response()->json([
            'data' => [
                'booking_id' => $booking->booking_id,
                'bk_code' => $booking->bk_code,
                'bk_status' => $booking->bk_status,
                'bk_publish_price' => (float) $booking->bk_publish_price,
                'bk_total_price' => (float) $booking->bk_total_price,
                'biaya_layanan' => (float) $booking->bk_total_price - (float) $booking->bk_publish_price,
                'berlaku_sampai' => $booking->bk_hold_until,
                'jadwal' => $availability ? [
                    'availability_id' => $availability->availability_id,
                    'dari' => $availability->route?->originStation?->stn_name,
                    'tujuan' => $availability->route?->destinationStation?->stn_name,
                    'tanggal' => optional($availability->av_date)->toDateString(),
                    'jam_berangkat' => substr((string) $availability->av_time, 0, 5),
                    'kelas' => $availability->busUnit?->busType?->bt_name,
                    'armada' => $availability->busUnit?->bu_code,
                ] : null,
                'passengers' => $booking->passengers->map(fn ($p) => [
                    'ps_name' => $p->ps_name,
                    'ps_category' => $p->ps_category,
                    'ps_age' => $p->ps_age,
                    'ps_gender' => $p->ps_gender,
                    'ps_nationality' => $p->ps_nationality,
                    'naik_dari' => $p->fromStop?->station?->stn_name,
                    'turun_di' => $p->toStop?->station?->stn_name,
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
