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
     * Cari company_id dari input form (bisa pilih PO bus yang sudah ada
     * lewat company_id, atau ketik nama PO baru lewat company_name --
     * kalau namanya sudah ada, dipakai ulang; kalau belum, dibuatkan baru).
     */
    private function resolveCompanyId(array $data): int
    {
        if (! empty($data['company_id'])) {
            return (int) $data['company_id'];
        }

        $nama = trim($data['company_name'] ?? '');
        abort_if($nama === '', 422, 'Pilih PO bus atau ketik nama PO baru.');

        $company = Company::whereRaw('LOWER(co_name) = ?', [mb_strtolower($nama)])->first()
            ?? Company::create(['co_name' => $nama]);

        return $company->company_id;
    }

    /**
     * GET /api/admin/bus-type
     * List semua KELAS bus (Ekonomi/Eksekutif/Sleeper, dst) untuk tabel
     * panel admin. Fasilitas & kapasitas fisik sekarang ada di level armada
     * (bus_unit), bukan di sini lagi -- lihat AdminBusUnitController.
     */
    public function index(Request $request): JsonResponse
    {
        $busTypes = BusType::query()
            ->with('company')
            ->withCount('busUnits')
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
            'jumlah_armada' => $bt->bus_units_count,
        ]);

        return response()->json($busTypes);
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'companies' => Company::orderBy('co_name')->get(['company_id', 'co_name']),
        ]);
    }

    /**
     * POST /api/admin/bus-type
     * Tambah kelas bus baru (nama & PO bus). PO bus bisa pilih yang sudah
     * ada (company_id) atau ketik nama baru (company_name) -- kalau baru,
     * PO tersebut otomatis dibuat.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => 'nullable|integer|exists:company,company_id',
            'company_name' => 'nullable|string|max:150',
            'bt_name' => 'required|string|max:100',
        ]);

        $busType = BusType::create([
            'company_id' => $this->resolveCompanyId($data),
            'bt_name' => $data['bt_name'],
        ]);

        return response()->json([
            'message' => 'Kelas bus baru berhasil ditambahkan.',
            'data' => $busType->load('company'),
        ], 201);
    }

    /**
     * PUT /api/admin/bus-type/{id}
     * Ubah nama kelas bus, atau pindah ke PO bus lain.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $busType = BusType::findOrFail($id);

        $data = $request->validate([
            'company_id' => 'nullable|integer|exists:company,company_id',
            'company_name' => 'nullable|string|max:150',
            'bt_name' => 'required|string|max:100',
        ]);

        $busType->update([
            'company_id' => $this->resolveCompanyId($data),
            'bt_name' => $data['bt_name'],
        ]);

        return response()->json([
            'message' => 'Kelas bus berhasil diperbarui.',
            'data' => $busType->load('company'),
        ]);
    }

    /**
     * DELETE /api/admin/bus-type/{id}
     * Hapus kelas bus. Ditolak kalau masih ada armada (bus_unit) yang
     * memakai kelas ini -- hapus/pindahkan armadanya dulu di menu Armada.
     */
    public function destroy(int $id): JsonResponse
    {
        $busType = BusType::findOrFail($id);

        if ($busType->busUnits()->exists()) {
            return response()->json([
                'message' => 'Kelas bus ini masih punya armada terdaftar. Hapus atau pindahkan armadanya dulu di menu Armada.',
            ], 422);
        }

        $busType->delete();

        return response()->json([
            'message' => 'Kelas bus berhasil dihapus.',
        ]);
    }
}
