<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJadwalController extends Controller
{
    /**
     * GET /api/admin/jadwal
     * List semua jadwal untuk ditampilkan di tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $jadwal = Availability::query()
            ->with(['route.originStation.region', 'route.destinationStation.region', 'busType'])
            ->when($request->tanggal, fn ($q) => $q->where('av_date', $request->tanggal))
            ->orderByDesc('av_date')
            ->paginate(20);

        return response()->json($jadwal);
    }

    /**
     * PUT /api/admin/jadwal/{id}
     * Update harga, jam, atau status satu jadwal.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);

        $data = $request->validate([
            'av_time' => 'sometimes|date_format:H:i:s',
            'av_price' => 'sometimes|array',
            'av_price.adult' => 'required_with:av_price|numeric|min:0',
            'av_price.child' => 'required_with:av_price|numeric|min:0',
            'av_status' => 'sometimes|in:active,inactive,cancelled',
        ]);

        $availability->update($data);

        return response()->json([
            'message' => 'Jadwal berhasil diperbarui.',
            'data' => $availability,
        ]);
    }

    /**
     * DELETE /api/admin/jadwal/{id}
     * Nonaktifkan jadwal (bukan hapus permanen, supaya riwayat booking lama tetap aman).
     */
    public function destroy(int $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);
        $availability->update(['av_status' => 'cancelled']);

        return response()->json([
            'message' => 'Jadwal berhasil dinonaktifkan.',
        ]);
    }
}