<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStationController extends Controller
{
    /**
     * GET /api/admin/station
     * List semua terminal untuk ditampilkan di tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $stations = Station::query()
            ->with('region')
            ->when($request->cari, function ($q) use ($request) {
                $kata = $request->cari;
                $q->where(function ($sub) use ($kata) {
                    $sub->where('stn_name', 'like', "%{$kata}%")
                        ->orWhere('stn_address', 'like', "%{$kata}%")
                        ->orWhereHas('region', fn ($r) => $r->where('rg_city', 'like', "%{$kata}%"));
                });
            })
            ->orderBy('station_id', 'desc')
            ->paginate(10);

        $stations->getCollection()->transform(fn ($s) => $this->formatStation($s));

        return response()->json($stations);
    }

    public function options(): JsonResponse
    {
        $regions = Region::orderBy('rg_city')
            ->get(['region_id', 'rg_city', 'rg_province'])
            ->map(fn ($r) => [
                'region_id' => $r->region_id,
                'label' => "{$r->rg_city}, {$r->rg_province}",
            ]);

        return response()->json([
            'regions' => $regions,
        ]);
    }

    /**
     * POST /api/admin/station
     * Tambah terminal baru.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'region_id' => 'required|exists:region,region_id',
            'stn_name' => 'required|string|max:150',
            'stn_address' => 'nullable|string|max:255',
        ]);

        $station = Station::create($data);

        return response()->json([
            'message' => 'Terminal baru berhasil ditambahkan.',
            'data' => $this->formatStation($station->load('region')),
        ], 201);
    }

    /**
     * PUT /api/admin/station/{id}
     * Ubah data satu terminal.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $station = Station::findOrFail($id);

        $data = $request->validate([
            'region_id' => 'required|exists:region,region_id',
            'stn_name' => 'required|string|max:150',
            'stn_address' => 'nullable|string|max:255',
        ]);

        $station->update($data);

        return response()->json([
            'message' => 'Terminal berhasil diperbarui.',
            'data' => $this->formatStation($station->load('region')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $station = Station::findOrFail($id);

        $dipakai = $station->routesAsOrigin()->exists() || $station->routesAsDestination()->exists();
        if ($dipakai) {
            return response()->json([
                'message' => 'Terminal ini masih dipakai di salah satu rute, tidak bisa dihapus.',
            ], 422);
        }

        $station->delete();

        return response()->json([
            'message' => 'Terminal berhasil dihapus.',
        ]);
    }

    private function formatStation(Station $station): array
    {
        return [
            'station_id' => $station->station_id,
            'region_id' => $station->region_id,
            'stn_name' => $station->stn_name,
            'stn_address' => $station->stn_address,
            'kota' => $station->region?->rg_city,
            'provinsi' => $station->region?->rg_province,
        ];
    }
}
