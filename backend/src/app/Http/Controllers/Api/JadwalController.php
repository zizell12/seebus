<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Services\RouteFareCalculator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'dari' => 'required|string',
            'tujuan' => 'required|string',
            'tanggal' => 'required|date',
        ]);

        // Data kota di database selalu huruf kecil (lihat NormalizesCase),
        // jadi ketikan user juga di-lowercase-in dulu sebelum dicocokkan --
        // kalau tidak, pencarian "Bandung" (huruf besar dari user) tidak
        // akan pernah ketemu "bandung" (data di DB).
        $dari = mb_strtolower(trim($request->dari));
        $tujuan = mb_strtolower(trim($request->tujuan));

        $jadwal = Availability::query()
            ->with(['route.originStation.region', 'route.destinationStation.region', 'busUnit.busType.company', 'legs'])
            ->whereHas('route.originStation.region', function ($q) use ($dari) {
                $q->where('rg_city', $dari);
            })
            ->whereHas('route.destinationStation.region', function ($q) use ($tujuan) {
                $q->where('rg_city', $tujuan);
            })
            ->where('av_date', $request->tanggal)
            ->where('av_status', 'active')
            ->orderBy('av_time')
            ->get();

        $result = $jadwal->map(function ($item) {
            // Stok yang ditampilkan di kartu hasil pencarian adalah stok
            // buat perjalanan PENUH (dari titik paling awal ke titik paling
            // akhir) -- yaitu etape yang paling "penuh" di antara semua
            // etape, karena itu yang jadi batas sebenarnya.
            $terpakaiPalingBanyak = $item->legs->max('seats_booked') ?? 0;
            $kursiTersedia = max(0, $item->av_seats - $terpakaiPalingBanyak);

            $durasiMenit = $item->route->rt_duration_min;
            $jamBerangkat = substr($item->av_time, 0, 5);
            $waktuTiba = Carbon::parse($item->av_date->toDateString().' '.$item->av_time)
                ->addMinutes($durasiMenit ?? 0);

            return [
                'availability_id' => $item->availability_id,
                'operator' => $item->busUnit->busType->company->co_name,
                'kategori' => $item->busUnit->busType->bt_name,
                'armada' => $item->busUnit->bu_code,
                'fasilitas' => $item->busUnit->bu_facilities ?? [],
                'dari' => $item->route->originStation->region->rg_city,
                'tujuan' => $item->route->destinationStation->region->rg_city,
                'terminal_asal' => $item->route->originStation->stn_name,
                'terminal_tujuan' => $item->route->destinationStation->stn_name,
                'tanggal' => $item->av_date->toDateString(),
                'jam_berangkat' => $jamBerangkat,
                'durasi_menit' => $durasiMenit,
                'jam_tiba' => $waktuTiba->format('H:i'),
                'tanggal_tiba' => $waktuTiba->toDateString(),
                'harga' => $item->av_price['adult'] ?? 0,
                'harga_anak' => $item->av_price['child'] ?? 0,
                'harga_bayi' => $item->av_price['infant'] ?? 0,
                'kursi_tersedia' => $kursiTersedia,
            ];
        });

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * GET /api/jadwal/{id}/titik-pemberhentian
     * Daftar titik naik & titik turun yang bisa dipilih penumpang untuk satu
     * jadwal, lengkap dengan sisa stok dan harga (dari titik itu sampai
     * tujuan akhir) -- dipakai di halaman pemesanan sebelum isi data
     * penumpang. ALIH-ALIH peta kursi (sudah tidak ada nomor kursi lagi).
     */
    public function titikPemberhentian(int $id): JsonResponse
    {
        $availability = Availability::with(['route.stops.station', 'legs'])->findOrFail($id);

        $legByStopId = $availability->legs->keyBy('route_stop_id');
        $stops = $availability->route->stops; // sudah terurut stop_order
        $titikAkhir = $stops->last();

        $data = $stops->map(function ($stop) use ($legByStopId, $availability, $stops, $titikAkhir) {
            $isTitikAkhir = $stop->route_stop_id === $titikAkhir->route_stop_id;

            // Etape yang harus dilewati kalau naik DARI titik ini sampai
            // titik paling akhir -- dipakai buat cek sisa stok maupun harga,
            // pakai fungsi yang sama dengan BookingController supaya angkanya
            // selalu konsisten.
            $etapeSampaiAkhir = RouteFareCalculator::legsBetween($stop, $titikAkhir);

            $terpakaiPalingBanyak = $etapeSampaiAkhir
                ->map(fn ($etape) => $legByStopId->get($etape->route_stop_id)?->seats_booked ?? 0)
                ->max() ?? 0;

            $harga = $isTitikAkhir
                ? ['adult' => 0, 'child' => 0, 'infant' => 0]
                : RouteFareCalculator::calculate($stop, $titikAkhir);

            return [
                'route_stop_id' => $stop->route_stop_id,
                'nama' => $stop->station->stn_name,
                'stop_order' => $stop->stop_order,
                'bisa_naik' => in_array($stop->stop_type, ['pickup', 'both'], true) && ! $isTitikAkhir,
                'bisa_turun' => in_array($stop->stop_type, ['dropoff', 'both'], true) && $stop->stop_order > 0,
                'sisa_stok_dari_sini' => max(0, $availability->av_seats - $terpakaiPalingBanyak),
                'harga_dari_sini_sampai_akhir' => $harga,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
