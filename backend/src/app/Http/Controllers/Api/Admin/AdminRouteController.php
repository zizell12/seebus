<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminRouteController extends Controller
{
    /**
     * GET /api/admin/route
     * List semua rute untuk ditampilkan di tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $routes = Route::query()
            ->with(['originStation.region', 'destinationStation.region'])
            ->when($request->cari, function ($q) use ($request) {
                $kata = $request->cari;
                $q->where(function ($sub) use ($kata) {
                    $sub->whereHas('originStation', fn ($s) => $s->where('stn_name', 'like', "%{$kata}%"))
                        ->orWhereHas('destinationStation', fn ($s) => $s->where('stn_name', 'like', "%{$kata}%"))
                        ->orWhereHas('originStation.region', fn ($r) => $r->where('rg_city', 'like', "%{$kata}%"))
                        ->orWhereHas('destinationStation.region', fn ($r) => $r->where('rg_city', 'like', "%{$kata}%"));
                });
            })
            ->orderBy('route_id', 'desc')
            ->paginate(10);

        $routes->getCollection()->transform(fn ($route) => $this->formatRoute($route));

        return response()->json($routes);
    }

    /**
     * GET /api/admin/route-options
     * Daftar terminal/stasiun (dengan kota-nya), dipakai untuk dropdown
     * asal & tujuan di form tambah/edit rute.
     */
    public function options(): JsonResponse
    {
        $stations = Station::with('region')
            ->get()
            ->map(fn ($s) => [
                'station_id' => $s->station_id,
                'stn_name' => $s->stn_name,
                'kota' => $s->region?->rg_city,
                'label' => $s->region ? "{$s->stn_name} ({$s->region->rg_city})" : $s->stn_name,
            ])
            ->sortBy('label')
            ->values();

        return response()->json([
            'stations' => $stations,
        ]);
    }

    /**
     * POST /api/admin/route
     * Tambah rute baru (terminal asal, terminal tujuan, jarak, durasi).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        $route = Route::create($data);

        return response()->json([
            'message' => 'Rute baru berhasil ditambahkan.',
            'data' => $this->formatRoute($route->load(['originStation.region', 'destinationStation.region'])),
        ], 201);
    }

    /**
     * PUT /api/admin/route/{id}
     * Ubah terminal asal/tujuan, jarak, atau durasi tempuh satu rute.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $route = Route::findOrFail($id);

        $data = $this->validateData($request, $route->route_id);

        $route->update($data);

        return response()->json([
            'message' => 'Rute berhasil diperbarui.',
            'data' => $this->formatRoute($route->load(['originStation.region', 'destinationStation.region'])),
        ]);
    }

    /**
     * DELETE /api/admin/route/{id}
     * Hapus rute. Ditolak kalau rute ini masih dipakai di salah satu
     * jadwal, supaya riwayat jadwal & booking lama tidak rusak (sama
     * seperti AdminBusTypeController::destroy).
     */
    public function destroy(int $id): JsonResponse
    {
        $route = Route::findOrFail($id);

        if ($route->availabilities()->exists()) {
            return response()->json([
                'message' => 'Rute ini masih dipakai di salah satu jadwal, tidak bisa dihapus.',
            ], 422);
        }

        $route->delete();

        return response()->json([
            'message' => 'Rute berhasil dihapus.',
        ]);
    }

    /**
     * Validasi bersama untuk store() & update(). $routeIdSaatIni dipakai
     * supaya pengecekan "rute duplikat" tidak menganggap rute yang sedang
     * diedit itu sendiri sebagai duplikat.
     */
    private function validateData(Request $request, ?int $routeIdSaatIni = null): array
    {
        $data = $request->validate([
            'origin_station_id' => 'required|exists:station,station_id',
            'destination_station_id' => 'required|exists:station,station_id',
            'rt_distance_km' => 'nullable|numeric|min:0|max:9999.99',
            'rt_duration_min' => 'nullable|integer|min:1|max:100000',
        ]);

        if ((string) $data['origin_station_id'] === (string) $data['destination_station_id']) {
            throw ValidationException::withMessages([
                'destination_station_id' => ['Terminal asal dan tujuan tidak boleh sama.'],
            ]);
        }

        $sudahAda = Route::where('origin_station_id', $data['origin_station_id'])
            ->where('destination_station_id', $data['destination_station_id'])
            ->when($routeIdSaatIni, fn ($q) => $q->where('route_id', '!=', $routeIdSaatIni))
            ->exists();

        if ($sudahAda) {
            throw ValidationException::withMessages([
                'destination_station_id' => ['Rute dengan terminal asal dan tujuan yang sama sudah ada.'],
            ]);
        }

        return $data;
    }

    private function formatRoute(Route $route): array
    {
        return [
            'route_id' => $route->route_id,
            'origin_station_id' => $route->origin_station_id,
            'destination_station_id' => $route->destination_station_id,
            'terminal_asal' => $route->originStation?->stn_name,
            'kota_asal' => $route->originStation?->region?->rg_city,
            'terminal_tujuan' => $route->destinationStation?->stn_name,
            'kota_tujuan' => $route->destinationStation?->region?->rg_city,
            'rt_distance_km' => $route->rt_distance_km,
            'rt_duration_min' => $route->rt_duration_min,
        ];
    }
}
