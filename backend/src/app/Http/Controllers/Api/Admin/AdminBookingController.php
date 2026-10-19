<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\BookingCancelledMail;
use App\Models\Booking;
use App\Services\BookingCancellationService;
use App\Services\RefundPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AdminBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'sometimes|in:pending,paid,cancelled,expired',
            'q' => 'sometimes|string|max:100',
        ]);

        $query = Booking::query()->with(['availability.route', 'contact', 'passengers']);
        if ($request->status) {
            $query->where('bk_status', $request->status);
        }
        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('bk_code', 'like', "%{$request->q}%")
                    ->orWhereHas('contact', fn ($q) => $q
                        ->where('ct_name', 'like', "%{$request->q}%")
                        ->orWhere('ct_email', 'like', "%{$request->q}%"));
            });
        }

        $bookings = $query->orderByDesc('booking_id')->paginate(20);
        $bookings->getCollection()->transform(function (Booking $booking) {
            $item = $booking->toArray();
            $item['bk_total_price'] = (float) $booking->bk_total_price;
            $item['bk_refund_amount'] = (float) ($booking->bk_refund_amount ?? 0);
            $item['nama'] = $booking->contact?->ct_name;
            $item['email'] = $booking->contact?->ct_email;
            $item['tanggal'] = $booking->availability?->av_date?->toDateString();
            $item['jam_berangkat'] = $booking->availability
                ? substr((string) $booking->availability->av_time, 0, 5)
                : null;

            return $item;
        });

        return response()->json($bookings->toArray());
    }

    public function show(int $bookingId): JsonResponse
    {
        $booking = Booking::with([
            'availability.route.originStation.region',
            'availability.route.destinationStation.region',
            'availability.busUnit.busType.company',
            'contact',
            'passengers.fromStop.station',
            'passengers.toStop.station',
        ])->findOrFail($bookingId);

        $canCancel = in_array($booking->bk_status, ['paid', 'pending'], true)
            && $booking->availability
            && ! RefundPolicy::departure($booking)->isPast();
        $refund = $canCancel && $booking->bk_status === 'paid' ? $this->refundPreview($booking) : null;

        return response()->json([
            'data' => [
                'booking_id' => $booking->booking_id,
                'bk_code' => $booking->bk_code,
                'bk_status' => $booking->bk_status,
                'bk_total_price' => (float) $booking->bk_total_price,
                'bk_paid_at' => $booking->bk_paid_at?->toISOString(),
                'kontak' => [
                    'nama' => $booking->contact?->ct_name,
                    'email' => $booking->contact?->ct_email,
                    'telepon' => $booking->contact?->ct_phone,
                ],
                'bisa_dibatalkan' => (bool) $canCancel,
                'pratinjau_refund' => $refund,
                'pembatalan' => $booking->bk_status === 'cancelled' ? [
                    'dibatalkan_pada' => $booking->bk_cancelled_at?->toISOString(),
                    'alasan' => $booking->bk_cancel_reason,
                    'refund_persen' => $booking->bk_refund_percent === null ? null : (int) $booking->bk_refund_percent,
                    'refund_jumlah' => (float) ($booking->bk_refund_amount ?? 0),
                    'refund_usd' => $booking->bk_refund_usd !== null ? (float) $booking->bk_refund_usd : null,
                    'refund_id' => $booking->bk_paypal_refund_id,
                    'direfund_pada' => $booking->bk_refunded_at?->toISOString(),
                ] : null,
                'penumpang' => $booking->passengers->map(fn ($p) => [
                    'ps_name' => $p->ps_name,
                    'ps_category' => $p->ps_category,
                    'ps_seat_number' => $p->ps_seat_number === null ? null : mb_strtoupper($p->ps_seat_number),
                    'naik_dari' => $p->fromStop?->station?->stn_name,
                    'turun_di' => $p->toStop?->station?->stn_name,
                ]),
                'jadwal' => [
                    'dari' => $booking->availability?->route?->originStation?->stn_name,
                    'tujuan' => $booking->availability?->route?->destinationStation?->stn_name,
                    'tanggal' => $booking->availability?->av_date?->toDateString(),
                    'jam' => $booking->availability?->av_time,
                ],
            ],
        ]);
    }

    public function cancel(Request $request, int $bookingId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:255',
            'refund_mode' => 'sometimes|in:kebijakan,penuh',
        ]);

        $booking = Booking::with('availability')->findOrFail($bookingId);
        $sudahDibayar = $booking->bk_status === 'paid';
        $result = (new BookingCancellationService)->cancel(
            $booking,
            $request->reason,
            $request->refund_mode ?? 'kebijakan',
            $request->user()?->user_id ?? 0,
        );

        $bookingTerbaru = $booking->fresh();
        $email = $bookingTerbaru?->contact?->ct_email;
        if ($email && $email !== 'customer@example.com') {
            try {
                Mail::to($email)->send(new BookingCancelledMail($bookingTerbaru, $sudahDibayar));
            } catch (\Throwable $e) {
                Log::error('Gagal mengirim email pembatalan booking', [
                    'booking_id' => $booking->booking_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Booking dibatalkan.',
            'data' => array_merge($bookingTerbaru->only([
                'booking_id', 'bk_code', 'bk_status', 'bk_cancelled_at',
                'bk_refund_percent', 'bk_refund_amount', 'bk_refund_usd',
                'bk_paypal_refund_id', 'bk_refunded_at',
            ]), ['pembatalan' => $result['pembatalan']]),
        ]);
    }

    private function refundPreview(Booking $booking): ?array
    {
        if ($booking->bk_status !== 'paid') {
            return null;
        }

        $kebijakan = RefundPolicy::evaluate($booking, 'kebijakan');
        $penuh = RefundPolicy::evaluate($booking, 'penuh');
        $jumlahUsdKebijakan = is_numeric($booking->bk_paid_usd) ? $kebijakan['jumlah_usd'] : null;
        $jumlahUsdPenuh = is_numeric($booking->bk_paid_usd) ? $penuh['jumlah_usd'] : null;

        return [
            'kebijakan' => [
                'persen' => $kebijakan['persen'],
                'jumlah' => $kebijakan['jumlah'],
                'jumlah_usd' => $jumlahUsdKebijakan,
            ],
            'penuh' => [
                'persen' => $penuh['persen'],
                'jumlah' => $penuh['jumlah'],
                'jumlah_usd' => $jumlahUsdPenuh,
            ],
        ];
    }

    /**
     * Rentang tanggal default kalau admin tidak isi dari/sampai secara
     * eksplisit -- disesuaikan per mode supaya default-nya masuk akal
     * (harian: 30 hari terakhir, bulanan: 12 bulan terakhir, dst).
     */
    private function resolveRange(Request $request, string $mode): array
    {
        if ($request->dari && $request->sampai) {
            return [$request->dari, $request->sampai];
        }

        $sampai = Carbon::today();
        $dari = match ($mode) {
            'tahunan' => Carbon::today()->subYears(4)->startOfYear(),
            'bulanan' => Carbon::today()->subMonths(11)->startOfMonth(),
            default => Carbon::today()->subDays(29),
        };

        return [$dari->toDateString(), $sampai->toDateString()];
    }

    /**
     * GET /api/admin/booking/rekap?mode=harian|bulanan|tahunan&dari=&sampai=
     * Cuma booking berstatus 'paid' yang dihitung sebagai "terjual" --
     * booking pending/expired belum/tidak jadi transaksi beneran.
     */
    public function rekap(Request $request): JsonResponse
    {
        $request->validate([
            'dari' => 'sometimes|required|date',
            'sampai' => 'sometimes|required|date',
        ]);
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $this->validateRange($dari, $sampai);
        [$ringkasan, $rincian] = $this->buildReport($dari, $sampai, $mode);

        return response()->json([
            'mode' => $mode,
            'dari' => $dari,
            'sampai' => $sampai,
            'ringkasan' => $ringkasan,
            'rincian' => $rincian,
        ]);
    }

    /**
     * GET /api/admin/booking/export?mode=harian|bulanan|tahunan&dari=&sampai=
     * Export laporan penjualan ke CSV sesuai mode & rentang tanggal yang
     * sama dengan yang dilihat admin di layar (lihat rekap() di atas).
     */
    public function export(Request $request): Response
    {
        $request->validate([
            'dari' => 'sometimes|required|date',
            'sampai' => 'sometimes|required|date',
        ]);
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $this->validateRange($dari, $sampai);
        [$ringkasan, $rincian] = $this->buildReport($dari, $sampai, $mode);

        $labelPeriode = match ($mode) {
            'tahunan' => 'Tahun',
            'bulanan' => 'Bulan',
            default => 'Tanggal',
        };

        $csv = "{$labelPeriode},Tiket Terjual,Pendapatan Tiket (Rp),Biaya Layanan (Rp),Total Dibayar (Rp),Pembatalan,Dibayar Dibatalkan (Rp),Refund (Rp),Ditahan (Rp)\n";
        foreach ($rincian as $baris) {
            $csv .= sprintf(
                "%s,%d,%s,%s,%s,%d,%s,%s,%s\n",
                $baris->periode,
                $baris->jumlah_tiket,
                $baris->pendapatan_tiket,
                $baris->biaya_layanan,
                $baris->total_pendapatan,
                $baris->jumlah_pembatalan,
                $baris->dibayar_dibatalkan,
                $baris->total_refund,
                $baris->ditahan,
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=laporan-penjualan-{$mode}-{$dari}_{$sampai}.csv",
        ]);
    }

    private function validateRange(string $dari, string $sampai): void
    {
        if (Carbon::parse($dari)->gt(Carbon::parse($sampai))) {
            throw ValidationException::withMessages([
                'dari' => ['Tanggal awal tidak boleh setelah tanggal akhir.'],
            ]);
        }
    }

    private function buildReport(string $dari, string $sampai, string $mode): array
    {
        $bookings = Booking::query()
            ->where('bk_status', 'paid')
            ->whereNotNull('bk_paid_at')
            ->whereBetween('bk_paid_at', [Carbon::parse($dari)->startOfDay(), Carbon::parse($sampai)->endOfDay()])
            ->get([
                'bk_paid_at', 'bk_adult_count', 'bk_child_count', 'bk_infant_count',
                'bk_net_price', 'bk_publish_price', 'bk_total_price',
            ]);

        $periodKey = match ($mode) {
            'tahunan' => 'Y',
            'bulanan' => 'Y-m',
            default => 'Y-m-d',
        };
        $emptyRow = fn (string $period) => (object) [
            'periode' => $period,
            'jumlah_booking' => 0,
            'jumlah_tiket' => 0,
            'jumlah_pembatalan' => 0,
            'pendapatan_tiket' => 0.0,
            'biaya_layanan' => 0.0,
            'total_pendapatan' => 0.0,
            'komisi_platform' => 0.0,
            'setoran_po' => 0.0,
            'dibayar_dibatalkan' => 0.0,
            'total_refund' => 0.0,
            'ditahan' => 0.0,
        ];

        $rincian = $bookings->groupBy(fn ($booking) => $booking->bk_paid_at->format($periodKey))
            ->map(function ($items, $period) use ($emptyRow) {
                $row = $emptyRow($period);
                $row->jumlah_booking = $items->count();
                $row->jumlah_tiket = $items->sum(fn ($booking) => $booking->bk_adult_count + $booking->bk_child_count + $booking->bk_infant_count);
                $row->pendapatan_tiket = $items->sum('bk_publish_price');
                $row->biaya_layanan = $items->sum(fn ($booking) => $booking->bk_total_price - $booking->bk_publish_price);
                $row->total_pendapatan = $items->sum('bk_total_price');
                $row->komisi_platform = $items->sum(fn ($booking) => $booking->bk_publish_price - $booking->bk_net_price);
                $row->setoran_po = $items->sum('bk_net_price');

                return $row;
            })
            ->sortBy('periode')
            ->values();

        $cancelled = Booking::query()
            ->where('bk_status', 'cancelled')
            ->whereNotNull('bk_paid_at')
            ->whereBetween('bk_cancelled_at', [Carbon::parse($dari)->startOfDay(), Carbon::parse($sampai)->endOfDay()])
            ->get(['bk_cancelled_at', 'bk_total_price', 'bk_refund_amount']);

        $cancelled->groupBy(fn ($booking) => $booking->bk_cancelled_at->format($periodKey))
            ->each(function ($items, $period) use ($emptyRow, $rincian) {
                $row = $rincian->firstWhere('periode', $period);
                if (! $row) {
                    $row = $emptyRow($period);
                    $rincian->push($row);
                }
                $row->jumlah_pembatalan = $items->count();
                $row->dibayar_dibatalkan = $items->sum('bk_total_price');
                $row->total_refund = $items->sum('bk_refund_amount');
                $row->ditahan = $row->dibayar_dibatalkan - $row->total_refund;
            });
        $rincian = $rincian->sortBy('periode')->values();

        $ringkasan = $emptyRow('total');
        foreach ($rincian as $row) {
            foreach ([
                'jumlah_booking',
                'jumlah_tiket',
                'jumlah_pembatalan',
                'pendapatan_tiket',
                'biaya_layanan',
                'total_pendapatan',
                'komisi_platform',
                'setoran_po',
                'dibayar_dibatalkan',
                'total_refund',
                'ditahan',
            ] as $field) {
                $ringkasan->{$field} += $row->{$field};
            }
        }

        return [$ringkasan, $rincian];
    }
}
