<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminBookingController extends Controller
{
    /**
     * Format tanggal buat GROUP BY di MySQL, tergantung mode laporan yang
     * diminta -- ini yang nentuin apa satu baris rekap mewakili 1 hari,
     * 1 bulan, atau 1 tahun.
     */
    private function formatGroupByMode(string $mode): string
    {
        return match ($mode) {
            'tahunan' => '%Y',
            'bulanan' => '%Y-%m',
            default => '%Y-%m-%d', // harian
        };
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
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $formatGroup = $this->formatGroupByMode($mode);

        $baseQuery = fn () => Booking::where('bk_status', 'paid')
            ->whereBetween(DB::raw('DATE(created_at)'), [$dari, $sampai]);

        $ringkasan = $baseQuery()
            ->selectRaw('COUNT(*) as jumlah_tiket, COALESCE(SUM(bk_total_price),0) as total_pendapatan')
            ->first();

        $rincian = $baseQuery()
            ->selectRaw("DATE_FORMAT(created_at, '{$formatGroup}') as periode, COUNT(*) as jumlah_tiket, COALESCE(SUM(bk_total_price),0) as total_pendapatan")
            ->groupBy('periode')
            ->orderBy('periode')
            ->get();

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
        $mode = in_array($request->mode, ['harian', 'bulanan', 'tahunan']) ? $request->mode : 'harian';
        [$dari, $sampai] = $this->resolveRange($request, $mode);
        $formatGroup = $this->formatGroupByMode($mode);

        $rincian = Booking::where('bk_status', 'paid')
            ->whereBetween(DB::raw('DATE(created_at)'), [$dari, $sampai])
            ->selectRaw("DATE_FORMAT(created_at, '{$formatGroup}') as periode, COUNT(*) as jumlah_tiket, COALESCE(SUM(bk_total_price),0) as total_pendapatan")
            ->groupBy('periode')
            ->orderBy('periode')
            ->get();

        $labelPeriode = match ($mode) {
            'tahunan' => 'Tahun',
            'bulanan' => 'Bulan',
            default => 'Tanggal',
        };

        $csv = "{$labelPeriode},Jumlah Tiket Terjual,Total Pendapatan (Rp)\n";
        foreach ($rincian as $baris) {
            $csv .= sprintf("%s,%d,%s\n", $baris->periode, $baris->jumlah_tiket, $baris->total_pendapatan);
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=laporan-penjualan-{$mode}-{$dari}_{$sampai}.csv",
        ]);
    }
}
