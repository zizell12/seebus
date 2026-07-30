<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PesanKontak;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPesanController extends Controller
{
    /**
     * GET /api/admin/pesan
     * List semua pesan dari form "Hubungi Kami" untuk ditampilkan di panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $pesan = PesanKontak::query()
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->cari, function ($q) use ($request) {
                $kata = $request->cari;
                $q->where(function ($sub) use ($kata) {
                    $sub->where('nama', 'like', "%{$kata}%")
                        ->orWhere('email', 'like', "%{$kata}%")
                        ->orWhere('pesan', 'like', "%{$kata}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->toArray();

        $pesan['stats'] = [
            'total' => PesanKontak::count(),
            'baru' => PesanKontak::where('status', 'baru')->count(),
            'dibaca' => PesanKontak::where('status', 'dibaca')->count(),
        ];

        return response()->json($pesan);
    }

    /**
     * PATCH /api/admin/pesan/{id}/baca
     * Tandai satu pesan sebagai sudah dibaca.
     */
    public function tandaiDibaca(int $id): JsonResponse
    {
        $pesan = PesanKontak::findOrFail($id);
        $pesan->update(['status' => 'dibaca']);

        return response()->json([
            'message' => 'Pesan ditandai sudah dibaca.',
            'data' => $pesan,
        ]);
    }

    /**
     * DELETE /api/admin/pesan/{id}
     * Hapus satu pesan dari kotak masuk.
     */
    public function destroy(int $id): JsonResponse
    {
        $pesan = PesanKontak::findOrFail($id);
        $pesan->delete();

        return response()->json([
            'message' => 'Pesan berhasil dihapus.',
        ]);
    }
}
