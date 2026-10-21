<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\Booking;
use App\Models\BusUnit;
use App\Models\Route;
use App\Mail\BookingCancelledMail;
use App\Services\BookingCancellationService;
use App\Services\AvailabilityGenerator;
use App\Services\BusUnitScheduleConflict;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminJadwalController extends Controller
{
    /**
     * GET /api/admin/jadwal
     * List semua jadwal untuk ditampilkan di tabel panel admin.
     */
    public function index(Request $request): JsonResponse
    {
        $jadwal = Availability::query()
            ->with(['route.originStation.region', 'route.destinationStation.region', 'busUnit.busType.company'])
            ->when($request->tanggal, fn ($q) => $q->where('av_date', $request->tanggal))
            ->when($request->route_id, fn ($q) => $q->where('route_id', $request->route_id))
            ->when($request->bus_unit_id, fn ($q) => $q->where('bus_unit_id', $request->bus_unit_id))
            ->when($request->status, fn ($q) => $q->where('av_status', $request->status))
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
            'operator' => $item->busUnit->busType->company->co_name,
            'bt_name' => $item->busUnit->busType->bt_name,
            'bu_code' => $item->busUnit->bu_code,
            'av_price' => $item->av_price,
            'av_status' => $item->av_status,
            'av_seats' => $item->av_seats,
        ]);

        return response()->json($jadwal);
    }

    /**
     * GET /api/admin/jadwal-options
     * Daftar rute (asal - tujuan, dengan nama terminal) dan armada (bus_unit),
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
                'siap_dipakai' => $route->isReadyForSchedule(),
                'masalah' => $route->stopsProblems(),
            ]);

        $busUnits = BusUnit::with('busType.company')
            ->where('is_active', true)
            ->get()
            ->map(fn ($bu) => [
                'bus_unit_id' => $bu->bus_unit_id,
                'label' => "{$bu->busType->company->co_name} - {$bu->busType->bt_name} ({$bu->bu_code})",
                'bt_name' => $bu->busType->bt_name,
                'bu_capacity' => $bu->bu_capacity,
                'bu_facilities' => $bu->bu_facilities,
            ]);

        return response()->json([
            'routes' => $routes,
            'bus_units' => $busUnits,
        ]);
    }

    /**
     * POST /api/admin/jadwal
     * Tambah jadwal baru secara manual dari panel admin. Harga TIDAK
     * diinput di sini lagi -- otomatis dihitung dari harga per etape yang
     * sudah didaftarkan untuk rute ini (lihat AdminRuteController).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_id' => 'required|exists:route,route_id',
            'bus_unit_id' => 'required|exists:bus_unit,bus_unit_id',
            'av_date' => 'required|date',
            'av_time' => 'required|date_format:H:i',
        ]);

        $sudahAda = Availability::where('route_id', $data['route_id'])
            ->where('bus_unit_id', $data['bus_unit_id'])
            ->where('av_date', $data['av_date'])
            ->where('av_time', $data['av_time'].':00')
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'message' => 'Jadwal dengan rute, armada, tanggal, dan jam yang sama sudah ada.',
            ], 422);
        }

        $route = Route::findOrFail($data['route_id']);

        if (! $route->isReadyForSchedule()) {
            return response()->json([
                'message' => $route->stopsProblems()[0],
            ], 422);
        }

        $busUnit = BusUnit::findOrFail($data['bus_unit_id']);

        if (BusUnitScheduleConflict::conflicts(
            (int) $busUnit->bus_unit_id,
            $data['av_date'],
            $data['av_time'].':00',
            routeId: (int) $route->route_id,
        )) {
            return response()->json([
                'message' => 'Armada ini sudah dijadwalkan di keberangkatan lain pada waktu yang berimpit.',
            ], 422);
        }

        $availability = AvailabilityGenerator::createAvailability(
            $route,
            $busUnit,
            $data['av_date'],
            $data['av_time'].':00',
        );

        return response()->json([
            'message' => 'Jadwal baru berhasil ditambahkan.',
            'data' => $availability->load(['route.originStation.region', 'route.destinationStation.region', 'busUnit.busType.company']),
        ], 201);
    }

    /**
     * POST /api/admin/jadwal/generate
     * Generate banyak jadwal sekaligus untuk satu rute + satu armada, di
     * rentang tanggal tertentu, dengan opsi memilih hari-dalam-minggu mana
     * saja yang mau diisi dan bisa lebih dari satu jam keberangkatan per hari.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_id' => 'required|exists:route,route_id',
            'bus_unit_id' => 'required|exists:bus_unit,bus_unit_id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'hari' => 'required|array|min:1', // 0=Minggu ... 6=Sabtu
            'hari.*' => 'integer|min:0|max:6',
            'jam' => 'required|array|min:1',
            'jam.*' => 'date_format:H:i',
        ]);

        // Batas rentang supaya admin tidak tidak sengaja generate ribuan
        // baris (mis. salah pilih tanggal selesai tahun depan).
        $mulai = Carbon::parse($data['tanggal_mulai']);
        $selesai = Carbon::parse($data['tanggal_selesai']);
        if ($mulai->diffInDays($selesai) > 90) {
            return response()->json([
                'message' => 'Rentang tanggal maksimal 90 hari sekali generate.',
            ], 422);
        }

        $route = Route::findOrFail($data['route_id']);

        if (! $route->isReadyForSchedule()) {
            return response()->json([
                'message' => $route->stopsProblems()[0],
            ], 422);
        }

        $busUnit = BusUnit::findOrFail($data['bus_unit_id']);

        $dibuat = 0;
        $dilewati = 0;
        $bentrok = 0;

        for ($tgl = $mulai->copy(); $tgl->lte($selesai); $tgl->addDay()) {
            if (! in_array((int) $tgl->dayOfWeek, $data['hari'], true)) {
                continue;
            }

            foreach ($data['jam'] as $jam) {
                $sudahAda = Availability::where('route_id', $route->route_id)
                    ->where('bus_unit_id', $busUnit->bus_unit_id)
                    ->where('av_date', $tgl->toDateString())
                    ->where('av_time', $jam.':00')
                    ->exists();

                if ($sudahAda) {
                    $dilewati++;

                    continue;
                }

                if (BusUnitScheduleConflict::conflicts(
                    (int) $busUnit->bus_unit_id,
                    $tgl->toDateString(),
                    $jam.':00',
                    routeId: (int) $route->route_id,
                )) {
                    $bentrok++;

                    continue;
                }

                AvailabilityGenerator::createAvailability(
                    $route,
                    $busUnit,
                    $tgl->toDateString(),
                    $jam.':00',
                );
                $dibuat++;
            }
        }

        return response()->json([
            'message' => "Berhasil generate {$dibuat} jadwal baru; {$dilewati} dilewati karena sudah ada dan {$bentrok} dilewati karena bentrok.",
            'dibuat' => $dibuat,
            'dilewati' => $dilewati,
            'bentrok' => $bentrok,
        ], 201);
    }

    /**
     * PUT /api/admin/jadwal/{id}
     * Update jam atau status satu jadwal. Harga tidak bisa diedit langsung
     * di sini -- kalau harga rute berubah, edit di menu Rute (titik
     * pemberhentian), lalu jadwal baru yang dibuat setelahnya otomatis
     * memakai harga terbaru.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);

        $data = $request->validate([
            'av_time' => 'sometimes|date_format:H:i',
            'av_status' => 'sometimes|in:active,inactive',
        ]);

        $jamBerubah = isset($data['av_time'])
            && $data['av_time'].':00' !== (string) $availability->av_time;
        if ($jamBerubah) {
            $bookingsAktif = $this->activeBookings($availability);
            if ($bookingsAktif->isNotEmpty()) {
                return response()->json([
                    'message' => "Jam tidak dapat diubah karena sudah ada {$bookingsAktif->count()} booking aktif. Batalkan booking terkait dulu.",
                ], 409);
            }

            if (BusUnitScheduleConflict::conflicts(
                (int) $availability->bus_unit_id,
                $availability->av_date->toDateString(),
                $data['av_time'].':00',
                ignoreAvailabilityId: (int) $availability->availability_id,
                routeId: (int) $availability->route_id,
            )) {
                return response()->json([
                    'message' => 'Armada ini sudah dijadwalkan di keberangkatan lain pada waktu yang berimpit.',
                ], 422);
            }

            $data['av_time'] .= ':00';
        }

        $dibatalkan = 0;
        if (($data['av_status'] ?? null) === 'inactive') {
            $result = $this->deactivate($request, $availability);
            if ($result instanceof JsonResponse) {
                return $result;
            }
            $dibatalkan = $result;
            $data['av_status'] = 'inactive';
        }

        if (($data['av_status'] ?? null) === 'active' && $availability->av_status === 'inactive') {
            $departure = Carbon::parse(
                $availability->av_date->toDateString().' '.($data['av_time'] ?? $availability->av_time),
                config('app.timezone'),
            );
            if ($departure->isPast()) {
                return response()->json([
                    'message' => 'Jadwal yang waktu berangkatnya sudah lewat tidak dapat diaktifkan kembali.',
                ], 422);
            }

            if (BusUnitScheduleConflict::conflicts(
                (int) $availability->bus_unit_id,
                $availability->av_date->toDateString(),
                $data['av_time'] ?? (string) $availability->av_time,
                ignoreAvailabilityId: (int) $availability->availability_id,
                routeId: (int) $availability->route_id,
            )) {
                return response()->json([
                    'message' => 'Armada ini sudah dijadwalkan di keberangkatan lain pada waktu yang berimpit.',
                ], 422);
            }
        }

        $availability->update($data);

        return response()->json([
            'message' => 'Jadwal berhasil diperbarui.',
            'data' => $availability,
            'dibatalkan' => $dibatalkan,
        ]);
    }

    /**
     * DELETE /api/admin/jadwal/{id}
     * Nonaktifkan jadwal (bukan hapus permanen, supaya riwayat booking lama tetap aman).
     */
    public function destroy(int $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);
        $result = $this->deactivate(request(), $availability);
        if ($result instanceof JsonResponse) {
            return $result;
        }
        $availability->update(['av_status' => 'inactive']);

        return response()->json([
            'message' => 'Jadwal berhasil dinonaktifkan.',
            'dibatalkan' => $result,
        ]);
    }

    private function activeBookings(Availability $availability)
    {
        $departure = Carbon::parse(
            $availability->av_date->toDateString().' '.$availability->av_time,
            config('app.timezone'),
        );
        if ($departure->isPast()) {
            return collect();
        }

        return $availability->bookings()
            ->where(function ($query) {
                $query->where('bk_status', 'paid')
                    ->orWhere(function ($query) {
                        $query->where('bk_status', 'pending')
                            ->where('bk_hold_until', '>', Carbon::now(config('app.timezone')));
                    });
            })
            ->with('contact')
            ->get();
    }

    private function deactivate(Request $request, Availability $availability): int|JsonResponse
    {
        $bookings = $this->activeBookings($availability);
        if ($bookings->isEmpty()) {
            return 0;
        }

        $jumlahPaid = $bookings->where('bk_status', 'paid')->count();
        $jumlahPending = $bookings->where('bk_status', 'pending')->count();
        if (! $request->boolean('batalkan_booking')) {
            return response()->json([
                'message' => "Jadwal memiliki {$bookings->count()} booking aktif. Konfirmasi pembatalan booking terlebih dahulu.",
                'jumlah_booking_aktif' => $bookings->count(),
                'jumlah_paid' => $jumlahPaid,
                'jumlah_pending' => $jumlahPending,
            ], 409);
        }

        $dibatalkan = 0;
        $gagal = [];
        foreach ($bookings as $booking) {
            $sudahDibayar = $booking->bk_status === 'paid';
            try {
                (new BookingCancellationService)->cancel(
                    $booking,
                    'Jadwal dibatalkan oleh operator',
                    'penuh',
                    (int) $request->user()->user_id,
                );
                $dibatalkan++;
            } catch (\Throwable $e) {
                $gagal[] = $booking->bk_code;
                Log::error('Gagal membatalkan booking saat jadwal dinonaktifkan', [
                    'booking_id' => $booking->booking_id,
                    'bk_code' => $booking->bk_code,
                    'error' => $e->getMessage(),
                ]);

                continue;
            }

            $bookingTerbaru = $booking->fresh();
            $email = $bookingTerbaru?->contact?->ct_email;
            if ($email && $email !== 'customer@example.com') {
                try {
                    Mail::to($email)->send(new BookingCancelledMail($bookingTerbaru, $sudahDibayar));
                } catch (\Throwable $e) {
                    Log::error('Gagal mengirim email pembatalan booking', [
                        'booking_id' => $booking->booking_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        if ($gagal !== []) {
            return response()->json([
                'message' => 'Sebagian booking gagal dibatalkan. Jadwal tetap aktif.',
                'gagal' => $gagal,
                'dibatalkan' => $dibatalkan,
            ], 422);
        }

        return $dibatalkan;
    }
}
