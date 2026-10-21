<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusUnit;
use App\Models\Route;
use App\Models\ScheduleTemplate;
use App\Services\JadwalTetapGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminJadwalTetapController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = ScheduleTemplate::query()
            ->with([
                'route.originStation',
                'route.destinationStation',
                'busUnit.busType.company',
            ])
            ->orderBy('schedule_template_id')
            ->get()
            ->map(fn (ScheduleTemplate $template) => $this->format($template));

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $template = ScheduleTemplate::create($data);

        return response()->json([
            'message' => 'Jadwal tetap berhasil ditambahkan.',
            'data' => $this->format($template->load([
                'route.originStation',
                'route.destinationStation',
                'busUnit.busType.company',
            ])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $template = ScheduleTemplate::findOrFail($id);
        $template->update($this->validateData($request, $template));

        return response()->json([
            'message' => 'Jadwal tetap berhasil diperbarui.',
            'data' => $this->format($template->fresh([
                'route.originStation',
                'route.destinationStation',
                'busUnit.busType.company',
            ])),
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $template = ScheduleTemplate::findOrFail($id);
        $template->update(['is_active' => ! $template->is_active]);

        return response()->json([
            'message' => $template->is_active ? 'Jadwal tetap diaktifkan.' : 'Jadwal tetap dinonaktifkan.',
            'data' => $this->format($template->load([
                'route.originStation',
                'route.destinationStation',
                'busUnit.busType.company',
            ])),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        ScheduleTemplate::findOrFail($id)->delete();

        return response()->json(['message' => 'Jadwal tetap berhasil dihapus.']);
    }

    public function generate(Request $request, JadwalTetapGenerator $generator): JsonResponse
    {
        $data = $request->validate([
            'hari' => 'sometimes|integer|min:1|max:60',
            'template_id' => 'sometimes|integer|exists:schedule_template,schedule_template_id',
        ]);

        return response()->json($generator->generate(
            (int) ($data['hari'] ?? 30),
            isset($data['template_id']) ? (int) $data['template_id'] : null,
        ));
    }

    private function validateData(Request $request, ?ScheduleTemplate $template = null): array
    {
        $data = $request->validate([
            'route_id' => 'required|integer|exists:route,route_id',
            'bus_unit_id' => 'required|integer|exists:bus_unit,bus_unit_id',
            'departure_time' => 'required|date_format:H:i',
            'days_of_week' => 'required|array|min:1',
            'days_of_week.*' => 'required|integer|min:0|max:6|distinct',
            'is_active' => 'sometimes|boolean',
        ]);

        $route = Route::findOrFail($data['route_id']);
        if (! $route->isReadyForSchedule()) {
            throw ValidationException::withMessages([
                'route_id' => [$route->stopsProblems()[0]],
            ]);
        }

        $busUnit = BusUnit::findOrFail($data['bus_unit_id']);
        if (! $busUnit->is_active) {
            throw ValidationException::withMessages([
                'bus_unit_id' => ['Armada harus berstatus aktif.'],
            ]);
        }

        $data['departure_time'] .= ':00';
        $duplicate = ScheduleTemplate::query()
            ->where('route_id', $data['route_id'])
            ->where('bus_unit_id', $data['bus_unit_id'])
            ->where('departure_time', $data['departure_time'])
            ->when($template !== null, fn ($query) => $query->where('schedule_template_id', '!=', $template->schedule_template_id))
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'departure_time' => ['Template jadwal dengan rute, armada, dan jam yang sama sudah ada.'],
            ]);
        }

        $data['days_of_week'] = array_map('intval', $data['days_of_week']);

        return $data;
    }

    private function format(ScheduleTemplate $template): array
    {
        return [
            'schedule_template_id' => $template->schedule_template_id,
            'route_id' => $template->route_id,
            'label_rute' => $template->route->originStation->stn_name.' - '.$template->route->destinationStation->stn_name,
            'bus_unit_id' => $template->bus_unit_id,
            'armada' => $template->busUnit->bu_code,
            'kelas' => $template->busUnit->busType?->bt_name,
            'perusahaan' => $template->busUnit->busType?->company?->co_name,
            'departure_time' => substr((string) $template->departure_time, 0, 5),
            'days_of_week' => array_map('intval', $template->days_of_week ?? []),
            'is_active' => (bool) $template->is_active,
        ];
    }
}
