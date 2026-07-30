<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\BusType;
use App\Models\Route;
use App\Services\AvailabilityGenerator;
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
            ->with(['route.originStation.region', 'route.destinationStation.region', 'busType.company'])
            ->when($request->tanggal, fn ($q) => $q->where('av_date', $request->tanggal))
            ->orderByDesc('av_date')
            ->orderBy('av_time')
            ->paginate(20);

        $jadwal->getCollection()->transform(fn ($item) => [
            'availability_id' => $item->availability_id,
            'terminal_asal' => $item->route->originStation->stn_name,
            'kota_asal' => $item->route->originStation->region->rg_city,
            'terminal_tujuan' => $item->route->destinationStation->stn_name,
            'kota_tujuan' => $item->route->destinationStation->region->rg_city,
            'av_date' => $item->av_date->toDateString(),
            'av_time' => substr($item->av_time, 0, 5),
            'operator' => $item->busType->company->co_name,
            'bt_name' => $item->busType->bt_name,
            'av_price' => $item->av_price,
            'av_status' => $item->av_status,
            'av_seats' => $item->av_seats,
        ]);

        return response()->json($jadwal);
    }

    /**
     * GET /api/admin/jadwal-options
     * Daftar rute (asal - tujuan, dengan nama terminal) dan tipe bus,
     * dipakai untuk dropdown di form tambah/edit jadwal panel admin.
     */
    public function options(): JsonResponse
    {
        $routes = Route::with(['originStation.region', 'destinationStation.region'])
            ->get()
            ->map(fn ($route) => [
                'route_id' => $route->route_id,
                'label' => sprintf(
                    '%s (%s) → %s (%s)',
                    $route->originStation->stn_name,
                    $route->originStation->region->rg_city,
                    $route->destinationStation->stn_name,
                    $route->destinationStation->region->rg_city,
                ),
            ]);

        $busTypes = BusType::with('company')
            ->get()
            ->map(fn ($bt) => [
                'bus_type_id' => $bt->bus_type_id,
                'label' => "{$bt->company->co_name} - {$bt->bt_name}",
                'bt_name' => $bt->bt_name,
                'bt_capacity' => $bt->bt_capacity,
            ]);

        return response()->json([
            'routes' => $routes,
            'bus_types' => $busTypes,
        ]);
    }

    /**
     * POST /api/admin/jadwal
     * Tambah jadwal baru secara manual dari panel admin.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_id' => 'required|exists:route,route_id',
            'bus_type_id' => 'required|exists:bus_type,bus_type_id',
            'av_date' => 'required|date',
            'av_time' => 'required|date_format:H:i',
            'av_price' => 'required|array',
            'av_price.adult' => 'required|numeric|min:0',
            'av_price.child' => 'required|numeric|min:0',
        ]);

        $sudahAda = Availability::where('route_id', $data['route_id'])
            ->where('bus_type_id', $data['bus_type_id'])
            ->where('av_date', $data['av_date'])
            ->where('av_time', $data['av_time'].':00')
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'message' => 'Jadwal dengan rute, tipe bus, tanggal, dan jam yang sama sudah ada.',
            ], 422);
        }

        $route = Route::findOrFail($data['route_id']);
        $busType = BusType::findOrFail($data['bus_type_id']);

        $availability = AvailabilityGenerator::createAvailability(
            $route,
            $busType,
            $data['av_date'],
            $data['av_time'].':00',
            (int) $data['av_price']['adult'],
            (int) $data['av_price']['child'],
        );

        return response()->json([
            'message' => 'Jadwal baru berhasil ditambahkan.',
            'data' => $availability->load(['route.originStation.region', 'route.destinationStation.region', 'busType.company']),
        ], 201);
    }

    /**
     * PUT /api/admin/jadwal/{id}
     * Update harga, jam, atau status satu jadwal.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);

        $data = $request->validate([
            'av_time' => 'sometimes|date_format:H:i',
            'av_price' => 'sometimes|array',
            'av_price.adult' => 'required_with:av_price|numeric|min:0',
            'av_price.child' => 'required_with:av_price|numeric|min:0',
            'av_status' => 'sometimes|in:active,inactive',
        ]);

        if (isset($data['av_time'])) {
            $data['av_time'] = $data['av_time'].':00';
        }

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
        $availability->update(['av_status' => 'inactive']);

        return response()->json([
            'message' => 'Jadwal berhasil dinonaktifkan.',
        ]);
    }
}