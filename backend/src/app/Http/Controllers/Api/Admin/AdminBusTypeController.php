<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusType;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBusTypeController extends Controller
{
    /**
     * Daftar fasilitas umum yang sering dipakai, ditampilkan sebagai pilihan
     * cepat di form (admin tetap bisa menambah fasilitas custom lain).
     */
    private const FASILITAS_UMUM = [
        'ac', 'wifi', 'snack', 'Reclining Seat', 'Toilet', 'Bantal & Selimut',
        'Kursi Standar 2-3', 'Kasur Individu', 'USB Charger', 'Legrest', 'Selimut',
    ];

    /**
     * GET /api/admin/bus-type
     * List semua tipe bus untuk ditampilkan di tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $busTypes = BusType::query()
            ->with('company')
            ->when($request->cari, function ($q) use ($request) {
                $kata = $request->cari;
                $q->where(function ($sub) use ($kata) {
                    $sub->where('bt_name', 'like', "%{$kata}%")
                        ->orWhereHas('company', fn ($c) => $c->where('co_name', 'like', "%{$kata}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10);

        $busTypes->getCollection()->transform(fn ($bt) => [
            'bus_type_id' => $bt->bus_type_id,
            'company_id' => $bt->company_id,
            'company_name' => $bt->company->co_name,
            'bt_name' => $bt->bt_name,
            'bt_capacity' => $bt->bt_capacity,
            'bt_facilities' => $bt->bt_facilities
                ? array_values(array_filter(array_map('trim', explode(',', $bt->bt_facilities))))
                : [],
        ]);

        return response()->json($busTypes);
    }

    /**
     * GET /api/admin/bus-type-options
     * Daftar perusahaan (untuk dropdown) dan daftar fasilitas umum (untuk
     * pilihan cepat) yang dipakai di form tambah/edit tipe bus.
     */
    public function options(): JsonResponse
    {
        $companies = Company::orderBy('co_name')
            ->get(['company_id', 'co_name'])
            ->map(fn ($c) => ['company_id' => $c->company_id, 'co_name' => $c->co_name]);

        return response()->json([
            'companies' => $companies,
            'fasilitas_umum' => self::FASILITAS_UMUM,
        ]);
    }

    /**
     * POST /api/admin/bus-type
     * Tambah tipe bus baru (nama, kapasitas, perusahaan, dan fasilitasnya).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => 'required|exists:company,company_id',
            'bt_name' => 'required|string|max:100',
            'bt_capacity' => 'required|integer|min:1|max:100',
            'bt_facilities' => 'array',
            'bt_facilities.*' => 'string|max:100',
        ]);

        $busType = BusType::create([
            'company_id' => $data['company_id'],
            'bt_name' => $data['bt_name'],
            'bt_capacity' => $data['bt_capacity'],
            'bt_facilities' => implode(', ', $data['bt_facilities'] ?? []),
        ]);

        return response()->json([
            'message' => 'Tipe bus baru berhasil ditambahkan.',
            'data' => $busType->load('company'),
        ], 201);
    }

    /**
     * PUT /api/admin/bus-type/{id}
     * Ubah data tipe bus & fasilitasnya.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $busType = BusType::findOrFail($id);

        $data = $request->validate([
            'company_id' => 'required|exists:company,company_id',
            'bt_name' => 'required|string|max:100',
            'bt_capacity' => 'required|integer|min:1|max:100',
            'bt_facilities' => 'array',
            'bt_facilities.*' => 'string|max:100',
        ]);

        $busType->update([
            'company_id' => $data['company_id'],
            'bt_name' => $data['bt_name'],
            'bt_capacity' => $data['bt_capacity'],
            'bt_facilities' => implode(', ', $data['bt_facilities'] ?? []),
        ]);

        return response()->json([
            'message' => 'Tipe bus berhasil diperbarui.',
            'data' => $busType->load('company'),
        ]);
    }

    /**
     * DELETE /api/admin/bus-type/{id}
     * Hapus tipe bus. Ditolak kalau tipe bus ini masih dipakai di salah satu
     * jadwal, supaya riwayat jadwal & booking lama tidak rusak.
     */
    public function destroy(int $id): JsonResponse
    {
        $busType = BusType::findOrFail($id);

        if ($busType->availabilities()->exists()) {
            return response()->json([
                'message' => 'Tipe bus ini masih dipakai di salah satu jadwal, tidak bisa dihapus.',
            ], 422);
        }

        $busType->delete();

        return response()->json([
            'message' => 'Tipe bus berhasil dihapus.',
        ]);
    }
}