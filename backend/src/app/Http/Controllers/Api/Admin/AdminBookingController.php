<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class AdminBookingController extends Controller
{
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
        [, $rincian] = $this->buildReport($dari, $sampai, $mode);

        $labelPeriode = match ($mode) {
            'tahunan' => 'Tahun',
            'bulanan' => 'Bulan',
            default => 'Tanggal',
        };

        $csv = "{$labelPeriode},Tiket Terjual,Pendapatan Tiket (Rp),Biaya Layanan (Rp),Total Dibayar (Rp)\n";
        foreach ($rincian as $baris) {
            $csv .= sprintf("%s,%d,%s,%s,%s\n", $baris->periode, $baris->jumlah_tiket, $baris->pendapatan_tiket, $baris->biaya_layanan, $baris->total_pendapatan);
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
            'pendapatan_tiket' => 0.0,
            'biaya_layanan' => 0.0,
            'total_pendapatan' => 0.0,
            'komisi_platform' => 0.0,
            'setoran_po' => 0.0,
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

        $ringkasan = $emptyRow('total');
        foreach ($rincian as $row) {
            foreach (['jumlah_booking', 'jumlah_tiket', 'pendapatan_tiket', 'biaya_layanan', 'total_pendapatan', 'komisi_platform', 'setoran_po'] as $field) {
                $ringkasan->{$field} += $row->{$field};
            }
        }

        return [$ringkasan, $rincian];
    }
}
