<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusType;
use App\Models\BusUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBusUnitController extends Controller
{
    /**
     * Daftar fasilitas umum yang sering dipakai, ditampilkan sebagai pilihan
     * cepat di form (admin tetap bisa menambah fasilitas custom lain).
     */
    private const FASILITAS_UMUM = [
        'ac', 'wifi', 'toilet', 'snack', 'reclining seat', 'bantal & selimut',
        'usb charger', 'legrest', 'kasur individu', 'hiburan/tv',
    ];

    /**
     * GET /api/admin/bus-unit
     * List semua armada untuk tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $busUnits = BusUnit::query()
            ->with('busType.company')
            ->when($request->cari, function ($q) use ($request) {
                $kata = $request->cari;
                $q->where(function ($sub) use ($kata) {
                    $sub->where('bu_code', 'like', "%{$kata}%")
                        ->orWhere('bu_plate_number', 'like', "%{$kata}%")
                        ->orWhereHas('busType', fn ($bt) => $bt->where('bt_name', 'like', "%{$kata}%"));
                });
            })
            ->when($request->bus_type_id, fn ($q) => $q->where('bus_type_id', $request->bus_type_id))
            ->orderByDesc('created_at')
            ->paginate(10);

        $busUnits->getCollection()->transform(fn ($bu) => $this->format($bu));

        return response()->json($busUnits);
    }

    /**
     * GET /api/admin/bus-unit-options
     * Daftar kelas bus (bus_type, dengan nama PO-nya) untuk dropdown di
     * form tambah/edit armada, plus daftar fasilitas umum.
     */
    public function options(): JsonResponse
    {
        $busTypes = BusType::with('company')
            ->get()
            ->map(fn ($bt) => [
                'bus_type_id' => $bt->bus_type_id,
                'label' => "{$bt->company->co_name} - {$bt->bt_name}",
            ]);

        return response()->json([
            'bus_types' => $busTypes,
            'fasilitas_umum' => self::FASILITAS_UMUM,
        ]);
    }

    /**
     * POST /api/admin/bus-unit
     * Tambah armada baru: kelas bus, kode/nama unit, plat nomor, kapasitas
     * kursi, dan daftar fasilitasnya.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        $busUnit = BusUnit::create($data);

        return response()->json([
            'message' => 'Armada baru berhasil ditambahkan.',
            'data' => $this->format($busUnit->load('busType.company')),
        ], 201);
    }

    /**
     * PUT /api/admin/bus-unit/{id}
     * Ubah data satu armada.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $busUnit = BusUnit::findOrFail($id);

        $data = $this->validateData($request);
        $busUnit->update($data);

        return response()->json([
            'message' => 'Armada berhasil diperbarui.',
            'data' => $this->format($busUnit->load('busType.company')),
        ]);
    }

    /**
     * PATCH /api/admin/bus-unit/{id}/status
     * Aktif/nonaktifkan armada. Armada nonaktif tidak akan dipakai lagi
     * saat generate jadwal baru (lihat AvailabilityGenerator), tapi jadwal
     * lama yang sudah memakainya tetap aman/tidak berubah.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $busUnit = BusUnit::findOrFail($id);
        $busUnit->update(['is_active' => ! $busUnit->is_active]);

        return response()->json([
            'message' => $busUnit->is_active ? 'Armada diaktifkan kembali.' : 'Armada dinonaktifkan.',
            'data' => $this->format($busUnit->load('busType.company')),
        ]);
    }

    /**
     * DELETE /api/admin/bus-unit/{id}
     * Hapus armada. Ditolak kalau armada ini masih dipakai di salah satu
     * jadwal -- nonaktifkan saja (lihat toggleStatus) kalau tidak mau
     * dipakai lagi tapi riwayatnya perlu tetap ada.
     */
    public function destroy(int $id): JsonResponse
    {
        $busUnit = BusUnit::findOrFail($id);

        if ($busUnit->availabilities()->exists()) {
            return response()->json([
                'message' => 'Armada ini masih dipakai di salah satu jadwal, tidak bisa dihapus. Nonaktifkan saja kalau tidak mau dipakai lagi.',
            ], 422);
        }

        $busUnit->delete();

        return response()->json([
            'message' => 'Armada berhasil dihapus.',
        ]);
    }

    private function validateData(Request $request): array
    {
        $data = $request->validate([
            'bus_type_id' => 'required|integer|exists:bus_type,bus_type_id',
            'bu_code' => 'required|string|max:100',
            'bu_plate_number' => 'nullable|string|max:20',
            'bu_capacity' => 'required|integer|min:1|max:100',
            'bu_facilities' => 'array',
            'bu_facilities.*' => 'string|max:100',
        ]);

        $data['bu_facilities'] = $data['bu_facilities'] ?? [];

        return $data;
    }

    private function format(BusUnit $busUnit): array
    {
        return [
            'bus_unit_id' => $busUnit->bus_unit_id,
            'bus_type_id' => $busUnit->bus_type_id,
            'kelas' => $busUnit->busType?->bt_name,
            'perusahaan' => $busUnit->busType?->company?->co_name,
            'bu_code' => $busUnit->bu_code,
            'bu_plate_number' => $busUnit->bu_plate_number,
            'bu_capacity' => $busUnit->bu_capacity,
            'bu_facilities' => $busUnit->bu_facilities ?? [],
            'is_active' => $busUnit->is_active,
        ];
    }
}
