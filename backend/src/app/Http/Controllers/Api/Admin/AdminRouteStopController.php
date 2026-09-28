<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteStop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminRouteStopController extends Controller
{
    /**
     * GET /api/admin/route/{routeId}/stops
     * List titik pemberhentian satu rute, terurut dari titik keberangkatan
     * paling awal (stop_order 0) sampai tujuan akhir.
     */
    public function index(int $routeId): JsonResponse
    {
        $route = Route::findOrFail($routeId);

        $stops = $route->stops()->with('station.region')->get();

        return response()->json([
            'data' => $stops->map(fn ($s) => $this->format($s)),
            'sudah_punya_jadwal' => $route->availabilities()->exists(),
        ]);
    }

    /**
     * POST /api/admin/route/{routeId}/stops
     * Tambah titik pemberhentian baru di URUTAN PALING AKHIR. Titik
     * pertama (stop_order 0) otomatis tidak diminta harga (tidak ada etape
     * sebelumnya); titik kedua dan seterusnya wajib diisi harga etape dari
     * titik sebelumnya sampai titik ini.
     */
    public function store(Request $request, int $routeId): JsonResponse
    {
        $route = Route::findOrFail($routeId);
        $this->pastikanBelumPunyaJadwal($route);

        $stopOrderBerikutnya = ($route->stops()->max('stop_order') ?? -1) + 1;
        $data = $this->validateData($request, $stopOrderBerikutnya);

        $stop = RouteStop::create(array_merge($data, [
            'route_id' => $route->route_id,
            'stop_order' => $stopOrderBerikutnya,
        ]));

        return response()->json([
            'message' => 'Titik pemberhentian berhasil ditambahkan.',
            'data' => $this->format($stop->load('station.region')),
        ], 201);
    }

    /**
     * PUT /api/admin/route/{routeId}/stops/{stopId}
     * Edit satu titik pemberhentian (terminal, tipe naik/turun, estimasi
     * waktu, harga etape).
     */
    public function update(Request $request, int $routeId, int $stopId): JsonResponse
    {
        $route = Route::findOrFail($routeId);
        $this->pastikanBelumPunyaJadwal($route);

        $stop = RouteStop::where('route_id', $route->route_id)->findOrFail($stopId);
        $data = $this->validateData($request, $stop->stop_order);

        $stop->update($data);

        return response()->json([
            'message' => 'Titik pemberhentian berhasil diperbarui.',
            'data' => $this->format($stop->load('station.region')),
        ]);
    }

    /**
     * DELETE /api/admin/route/{routeId}/stops/{stopId}
     * Cuma titik PALING AKHIR yang boleh dihapus, supaya urutan stop_order
     * tetap rapi (0, 1, 2, ...) tanpa lubang di tengah dan tanpa perlu
     * geser-geser nomor urut titik lain.
     */
    public function destroy(int $routeId, int $stopId): JsonResponse
    {
        $route = Route::findOrFail($routeId);
        $this->pastikanBelumPunyaJadwal($route);

        $stop = RouteStop::where('route_id', $route->route_id)->findOrFail($stopId);
        $stopOrderTerakhir = $route->stops()->max('stop_order');

        if ($stop->stop_order !== $stopOrderTerakhir) {
            return response()->json([
                'message' => 'Cuma titik pemberhentian paling akhir yang bisa dihapus. Hapus berurutan dari belakang.',
            ], 422);
        }

        $stop->delete();

        return response()->json(['message' => 'Titik pemberhentian berhasil dihapus.']);
    }

    /**
     * Jadwal (availability + availability_leg) sudah digenerate berdasarkan
     * daftar titik pemberhentian yang ada SAAT jadwal itu dibuat. Kalau titik
     * pemberhentian rute ini diubah setelahnya, jadwal & booking yang sudah
     * ada jadi tidak konsisten lagi (etape yang tercatat tidak sama dengan
     * yang beneran ada). Jadi begitu rute punya jadwal aktif, daftar titik
     * pemberhentiannya dikunci -- kalau perlu revisi besar, buat rute baru.
     */
    private function pastikanBelumPunyaJadwal(Route $route): void
    {
        if ($route->availabilities()->exists()) {
            throw ValidationException::withMessages([
                'route_id' => ['Rute ini sudah punya jadwal aktif. Titik pemberhentian tidak bisa diubah lagi supaya jadwal & booking lama tidak jadi tidak konsisten.'],
            ]);
        }
    }

    private function validateData(Request $request, int $stopOrder): array
    {
        $rules = [
            'station_id' => 'required|exists:station,station_id',
            'stop_type' => 'required|in:pickup,dropoff,both',
            'offset_minutes' => 'nullable|integer|min:0',
        ];

        // Titik pertama (stop_order 0) = titik keberangkatan, tidak ada
        // etape "sebelumnya" jadi tidak butuh harga. Titik kedua dan
        // seterusnya WAJIB diisi harga, karena itu yang jadi tarif etape.
        if ($stopOrder > 0) {
            $rules['fare_adult'] = 'required|numeric|min:0';
            $rules['fare_child'] = 'required|numeric|min:0';
            $rules['fare_infant'] = 'required|numeric|min:0';
        }

        $data = $request->validate($rules);

        if ($stopOrder === 0) {
            $data['fare_adult'] = null;
            $data['fare_child'] = null;
            $data['fare_infant'] = null;
        }

        return $data;
    }

    private function format(RouteStop $stop): array
    {
        return [
            'route_stop_id' => $stop->route_stop_id,
            'stop_order' => $stop->stop_order,
            'station_id' => $stop->station_id,
            'nama_terminal' => $stop->station?->stn_name,
            'kota' => $stop->station?->region?->rg_city,
            'stop_type' => $stop->stop_type,
            'offset_minutes' => $stop->offset_minutes,
            'fare_adult' => $stop->fare_adult,
            'fare_child' => $stop->fare_child,
            'fare_infant' => $stop->fare_infant,
        ];
    }
}
