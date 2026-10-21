<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\BookingCancelledMail;
use App\Models\Booking;
use App\Services\BookingCancellationService;
use App\Services\RefundPolicy;
use App\Support\CsvSafe;
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
        if ($request->filled('dari') && $request->filled('sampai')) {
            return [$request->dari, $request->sampai];
        }

        $sampai = Carbon::today(config('app.timezone'));
        $dari = match ($mode) {
            'tahunan' => Carbon::today(config('app.timezone'))->subYears(4)->startOfYear(),
            'bulanan' => Carbon::today(config('app.timezone'))->subMonths(11)->startOfMonth(),
            default => Carbon::today(config('app.timezone'))->subDays(29),
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
        $data = $this->validateReportRequest($request);
        $group = $data['kelompok'] ?? 'periode';
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $this->validateRange($dari, $sampai);
        [$ringkasan, $rincian] = $this->buildReport(
            $dari,
            $sampai,
            $mode,
            $group,
            isset($data['company_id']) ? (int) $data['company_id'] : null,
            isset($data['route_id']) ? (int) $data['route_id'] : null,
        );

        return response()->json([
            'mode' => $mode,
            'kelompok' => $group,
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
        $data = $this->validateReportRequest($request);
        $group = $data['kelompok'] ?? 'periode';
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $this->validateRange($dari, $sampai);
        [, $rincian] = $this->buildReport(
            $dari,
            $sampai,
            $mode,
            $group,
            isset($data['company_id']) ? (int) $data['company_id'] : null,
            isset($data['route_id']) ? (int) $data['route_id'] : null,
        );

        if ($group !== 'periode') {
            $csv = "Kelompok,Booking,Tiket Terjual,Pendapatan Tiket (Rp),Biaya Layanan (Rp),Komisi Platform (Rp),Setoran PO (Rp),Siap Disetor (Rp),Belum Berangkat (Rp),Pembatalan,Refund (Rp),Ditahan (Rp),Pendapatan Platform (Rp)\n";
            foreach ($rincian as $baris) {
                $csv .= implode(',', [
                    CsvSafe::cell($baris->label),
                    $baris->jumlah_booking,
                    $baris->jumlah_tiket,
                    $baris->pendapatan_tiket,
                    $baris->biaya_layanan,
                    $baris->komisi_platform,
                    $baris->setoran_po,
                    $baris->siap_disetor,
                    $baris->belum_berangkat,
                    $baris->jumlah_pembatalan,
                    $baris->total_refund,
                    $baris->ditahan,
                    $baris->pendapatan_platform,
                ])."\n";
            }

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=laporan-penjualan-{$group}-{$dari}_{$sampai}.csv",
            ]);
        }

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

    public function setoranExport(Request $request): Response
    {
        $data = $request->validate([
            'company_id' => 'required|integer|exists:company,company_id',
            'dari' => 'sometimes|required|date',
            'sampai' => 'sometimes|required|date',
            'route_id' => 'sometimes|required|integer|exists:route,route_id',
        ]);
        $rangeRequest = new Request([
            'dari' => $data['dari'] ?? null,
            'sampai' => $data['sampai'] ?? null,
        ]);
        [$dari, $sampai] = $this->resolveRange($rangeRequest, 'harian');
        $this->validateRange($dari, $sampai);

        $bookings = Booking::query()
            ->where('bk_status', 'paid')
            ->whereNotNull('bk_paid_at')
            ->whereBetween('bk_paid_at', [
                Carbon::parse($dari, config('app.timezone'))->startOfDay(),
                Carbon::parse($sampai, config('app.timezone'))->endOfDay(),
            ])
            ->whereHas('availability.busUnit.busType.company', fn ($query) => $query->where('company.company_id', $data['company_id']))
            ->when(isset($data['route_id']), fn ($query) => $query->whereHas('availability.route', fn ($routeQuery) => $routeQuery->where('route.route_id', $data['route_id'])))
            ->with($this->reportRelations())
            ->get([
                'booking_id', 'bk_code', 'availability_id', 'bk_paid_at',
                'bk_adult_count', 'bk_child_count', 'bk_infant_count',
                'bk_publish_price', 'bk_net_price',
            ]);

        $now = Carbon::now(config('app.timezone'));
        $csv = "Kode Booking,Tanggal Bayar,Tanggal Berangkat,Jam Berangkat,Rute,Armada,Penumpang,Harga Tiket (Rp),Setoran PO (Rp),Status\n";
        $siap = 0.0;
        $belum = 0.0;
        foreach ($bookings as $booking) {
            $availability = $booking->availability;
            $departure = $availability
                ? Carbon::parse($availability->av_date->toDateString().' '.$availability->av_time, config('app.timezone'))
                : null;
            $isReady = $departure && $departure->lte($now);
            $netPrice = (float) $booking->bk_net_price;
            if ($isReady) {
                $siap += $netPrice;
            } else {
                $belum += $netPrice;
            }
            $route = $availability?->route;
            $routeLabel = $route
                ? ($route->originStation?->stn_name ?? '').' - '.($route->destinationStation?->stn_name ?? '')
                : 'Tidak diketahui';

            $csv .= implode(',', [
                CsvSafe::cell($booking->bk_code),
                CsvSafe::cell($booking->bk_paid_at?->format('Y-m-d') ?? ''),
                CsvSafe::cell($availability?->av_date?->toDateString() ?? ''),
                CsvSafe::cell($availability ? substr((string) $availability->av_time, 0, 5) : ''),
                CsvSafe::cell($routeLabel),
                CsvSafe::cell($availability?->busUnit?->bu_code ?? 'Tidak diketahui'),
                CsvSafe::cell("dewasa {$booking->bk_adult_count}, anak {$booking->bk_child_count}, bayi {$booking->bk_infant_count}"),
                $booking->bk_publish_price,
                $booking->bk_net_price,
                CsvSafe::cell($isReady ? 'Siap disetor' : 'Belum berangkat'),
            ])."\n";
        }

        $csv .= implode(',', [
            CsvSafe::cell('TOTAL'),
            '', '', '', '', '', '', '',
            round($siap + $belum, 2),
            CsvSafe::cell('Siap disetor: '.number_format($siap, 2, '.', '').'; Belum berangkat: '.number_format($belum, 2, '.', '')),
        ])."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=setoran-po-{$data['company_id']}-{$dari}_{$sampai}.csv",
        ]);
    }

    private function validateReportRequest(Request $request): array
    {
        return $request->validate([
            'kelompok' => 'sometimes|required|in:periode,po,rute',
            'company_id' => 'sometimes|required|integer|exists:company,company_id',
            'route_id' => 'sometimes|required|integer|exists:route,route_id',
            'dari' => 'sometimes|required|date',
            'sampai' => 'sometimes|required|date',
        ]);
    }

    private function validateRange(string $dari, string $sampai): void
    {
        if (Carbon::parse($dari, config('app.timezone'))->gt(Carbon::parse($sampai, config('app.timezone')))) {
            throw ValidationException::withMessages([
                'dari' => ['Tanggal awal tidak boleh setelah tanggal akhir.'],
            ]);
        }
    }

    private function buildReport(
        string $dari,
        string $sampai,
        string $mode,
        string $group = 'periode',
        ?int $companyId = null,
        ?int $routeId = null,
    ): array
    {
        $relations = $this->reportRelations();
        $filters = function ($query) use ($companyId, $routeId) {
            $query->when($companyId !== null, fn ($query) => $query->whereHas(
                'availability.busUnit.busType.company',
                fn ($companyQuery) => $companyQuery->where('company.company_id', $companyId),
            ))->when($routeId !== null, fn ($query) => $query->whereHas(
                'availability.route',
                fn ($routeQuery) => $routeQuery->where('route.route_id', $routeId),
            ));
        };

        $bookings = Booking::query()
            ->where('bk_status', 'paid')
            ->whereNotNull('bk_paid_at')
            ->whereBetween('bk_paid_at', [
                Carbon::parse($dari, config('app.timezone'))->startOfDay(),
                Carbon::parse($sampai, config('app.timezone'))->endOfDay(),
            ])
            ->where($filters)
            ->with($relations)
            ->get([
                'booking_id', 'availability_id', 'bk_paid_at', 'bk_adult_count', 'bk_child_count', 'bk_infant_count',
                'bk_net_price', 'bk_publish_price', 'bk_total_price',
            ]);

        $periodKey = match ($mode) {
            'tahunan' => 'Y',
            'bulanan' => 'Y-m',
            default => 'Y-m-d',
        };
        $baseFields = [
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
            'setoran_po_siap' => 0.0,
            'setoran_po_belum' => 0.0,
            'ditahan_tiket' => 0.0,
            'ditahan_biaya_layanan' => 0.0,
            'ditahan_po' => 0.0,
            'ditahan_platform' => 0.0,
            'siap_disetor' => 0.0,
            'belum_berangkat' => 0.0,
            'pendapatan_platform' => 0.0,
        ];

        $rows = [];
        $now = Carbon::now(config('app.timezone'));
        foreach ($bookings as $booking) {
            $period = $booking->bk_paid_at->format($periodKey);
            $groupInfo = $this->reportGroup($booking, $group, $period);
            $row = $this->reportRow($rows, $groupInfo, $baseFields);
            $row->jumlah_booking++;
            $row->jumlah_tiket += (int) $booking->bk_adult_count + (int) $booking->bk_child_count + (int) $booking->bk_infant_count;
            $row->pendapatan_tiket += (float) $booking->bk_publish_price;
            $row->biaya_layanan += (float) $booking->bk_total_price - (float) $booking->bk_publish_price;
            $row->total_pendapatan += (float) $booking->bk_total_price;
            $row->komisi_platform += (float) $booking->bk_publish_price - (float) $booking->bk_net_price;
            $row->setoran_po += (float) $booking->bk_net_price;

            $availability = $booking->availability;
            if ($availability) {
                $departure = Carbon::parse(
                    $availability->av_date->toDateString().' '.$availability->av_time,
                    config('app.timezone'),
                );
                $targetField = $departure->lte($now) ? 'setoran_po_siap' : 'setoran_po_belum';
                $row->{$targetField} += (float) $booking->bk_net_price;
            }
        }

        $cancelled = Booking::query()
            ->where('bk_status', 'cancelled')
            ->whereNotNull('bk_paid_at')
            ->whereBetween('bk_cancelled_at', [
                Carbon::parse($dari, config('app.timezone'))->startOfDay(),
                Carbon::parse($sampai, config('app.timezone'))->endOfDay(),
            ])
            ->where($filters)
            ->with($relations)
            ->get([
                'booking_id', 'availability_id', 'bk_paid_at', 'bk_cancelled_at',
                'bk_adult_count', 'bk_child_count', 'bk_infant_count',
                'bk_net_price', 'bk_publish_price', 'bk_total_price', 'bk_refund_amount',
            ]);

        foreach ($cancelled as $booking) {
            $period = $booking->bk_cancelled_at->format($periodKey);
            $row = $this->reportRow($rows, $this->reportGroup($booking, $group, $period), $baseFields);
            $totalPaid = (float) $booking->bk_total_price;
            $totalRefund = (float) ($booking->bk_refund_amount ?? 0);
            $retained = max(0, round($totalPaid - $totalRefund, 2));
            $serviceFee = max(0, (float) $booking->bk_total_price - (float) $booking->bk_publish_price);
            // RefundPolicy mengembalikan persentase dari bk_total_price; sisa dibagi ke biaya layanan terlebih dahulu, lalu ke harga tiket.
            $retainedFee = min($retained, $serviceFee);
            $retainedTicket = max(0, $retained - $retainedFee);
            $netRatio = (float) $booking->bk_publish_price > 0
                ? (float) $booking->bk_net_price / (float) $booking->bk_publish_price
                : 0;
            $retainedPo = round($retainedTicket * $netRatio, 2);
            $retainedPlatform = round($retained - $retainedPo, 2);

            $row->jumlah_pembatalan++;
            $row->dibayar_dibatalkan += $totalPaid;
            $row->total_refund += $totalRefund;
            $row->ditahan += $retained;
            $row->ditahan_tiket += $retainedTicket;
            $row->ditahan_biaya_layanan += $retainedFee;
            $row->ditahan_po += $retainedPo;
            $row->ditahan_platform += $retainedPlatform;
        }

        foreach ($rows as $row) {
            foreach (['setoran_po_siap', 'setoran_po_belum', 'ditahan_tiket', 'ditahan_biaya_layanan', 'ditahan_po', 'ditahan_platform'] as $field) {
                $row->{$field} = round($row->{$field}, 2);
            }
            $row->ditahan = round($row->ditahan, 2);
            $row->siap_disetor = round($row->setoran_po_siap + $row->ditahan_po, 2);
            $row->belum_berangkat = round($row->setoran_po_belum, 2);
            $row->pendapatan_platform = round($row->komisi_platform + $row->biaya_layanan + $row->ditahan_platform, 2);
        }

        $rincian = collect(array_values($rows));
        if ($group === 'periode') {
            $rincian = $rincian->sortBy('periode')->values();
        } else {
            $rincian = $rincian->sort(function ($a, $b) {
                return ($b->siap_disetor <=> $a->siap_disetor)
                    ?: strcasecmp((string) $a->label, (string) $b->label);
            })->values();
        }

        $summaryRows = [];
        $ringkasan = $this->reportRow($summaryRows, ['key' => 'total', 'label' => 'total', 'period' => 'total'], $baseFields);
        foreach ($rincian as $row) {
            foreach (array_keys($baseFields) as $field) {
                $ringkasan->{$field} += $row->{$field};
            }
        }
        foreach (array_keys($baseFields) as $field) {
            if (str_contains($field, 'jumlah_') || $field === 'jumlah_tiket' || $field === 'jumlah_booking') {
                continue;
            }
            $ringkasan->{$field} = round($ringkasan->{$field}, 2);
        }

        return [$ringkasan, $rincian];
    }

    private function reportRelations(): array
    {
        return [
            'availability:availability_id,route_id,bus_unit_id,av_date,av_time',
            'availability.route:route_id,origin_station_id,destination_station_id',
            'availability.route.originStation:station_id,stn_name',
            'availability.route.destinationStation:station_id,stn_name',
            'availability.busUnit:bus_unit_id,bus_type_id,bu_code',
            'availability.busUnit.busType:bus_type_id,company_id',
            'availability.busUnit.busType.company:company_id,co_name',
        ];
    }

    private function reportGroup(Booking $booking, string $group, string $period): array
    {
        if ($group === 'periode') {
            return ['key' => $period, 'label' => $period, 'period' => $period];
        }

        $availability = $booking->availability;
        if ($group === 'po') {
            $company = $availability?->busUnit?->busType?->company;

            return [
                'key' => $company?->company_id,
                'label' => $company?->co_name ?? 'Tidak diketahui',
                'period' => null,
            ];
        }

        $route = $availability?->route;
        return [
            'key' => $route?->route_id,
            'label' => $route
                ? (($route->originStation?->stn_name ?? '').' - '.($route->destinationStation?->stn_name ?? ''))
                : 'Tidak diketahui',
            'period' => null,
        ];
    }

    private function reportRow(array &$rows, array $groupInfo, array $baseFields): object
    {
        $token = $groupInfo['key'] === null ? '__unknown__' : (string) $groupInfo['key'];
        if (! isset($rows[$token])) {
            $rows[$token] = (object) array_merge([
                'kunci' => $groupInfo['key'],
                'label' => $groupInfo['label'],
                'periode' => $groupInfo['period'],
            ], $baseFields);
        }

        return $rows[$token];
    }
}
