<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
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

        $jadwal = Availability::query()
            ->with(['route.originStation.region', 'route.destinationStation.region', 'busType.company'])
            ->whereHas('route.originStation.region', function ($q) use ($request) {
                $q->where('rg_city', $request->dari);
            })
            ->whereHas('route.destinationStation.region', function ($q) use ($request) {
                $q->where('rg_city', $request->tujuan);
            })
            ->where('av_date', $request->tanggal)
            ->where('av_status', 'active')
            ->orderBy('av_time')
            ->get();

        $result = $jadwal->map(function ($item) {
            $kursiTersedia = $item->seats()
                ->where(function ($q) {
                    $q->where('seat_status', 'empty')
                        ->orWhere(function ($q2) {
                            $q2->where('seat_status', 'locked')
                                ->where('seat_locked_until', '<', now());
                        });
                })
                ->count();

            $durasiMenit = $item->route->rt_duration_min;
            $jamBerangkat = substr($item->av_time, 0, 5);
            $waktuTiba = Carbon::parse($item->av_date->toDateString() . ' ' . $item->av_time)
                ->addMinutes($durasiMenit ?? 0);

            return [
                'availability_id' => $item->availability_id,
                'operator' => $item->busType->company->co_name,
                'kategori' => $item->busType->bt_name,
                'fasilitas' => array_map('trim', explode(',', $item->busType->bt_facilities ?? '')),
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
                'kursi_tersedia' => $kursiTersedia,
            ];
        });

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * GET /api/jadwal/{id}/kursi
     * Ambil layout kursi (nomor + status) untuk satu jadwal tertentu.
     */
    public function kursi(int $id): JsonResponse
    {
        $availability = Availability::with('seats')->findOrFail($id);

        $seats = $availability->seats->map(function ($seat) {
            $statusTampil = $seat->seat_status;
            if ($statusTampil === 'locked' && $seat->seat_locked_until !== null && $seat->seat_locked_until->isPast()) {
                $statusTampil = 'empty';
            }

            return [
                'seat_id' => $seat->seat_id,
                'nomor' => $seat->seat_number,
                'status' => $statusTampil, // empty | locked | booked
            ];
        });

        return response()->json([
            'data' => $seats,
        ]);
    }
}