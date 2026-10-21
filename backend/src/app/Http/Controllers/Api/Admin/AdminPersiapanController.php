<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\BusType;
use App\Models\BusUnit;
use App\Models\Route;
use App\Models\ScheduleTemplate;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class AdminPersiapanController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today(config('app.timezone'));
        $routes = Route::query()
            ->with([
                'originStation:station_id,stn_name',
                'destinationStation:station_id,stn_name',
                'stops:route_stop_id,route_id,station_id,stop_order',
            ])
            ->get(['route_id', 'origin_station_id', 'destination_station_id']);

        $readyRoutes = 0;
        $unreadyRoutes = [];
        foreach ($routes as $route) {
            if ($route->isReadyForSchedule()) {
                $readyRoutes++;

                continue;
            }

            $unreadyRoutes[] = [
                'route_id' => $route->route_id,
                'label' => ($route->originStation?->stn_name ?? 'Tidak diketahui')
                    .' - '.($route->destinationStation?->stn_name ?? 'Tidak diketahui'),
                'masalah' => $route->stopsProblems(),
            ];
        }

        $stationCount = Station::query()->count();
        $routeCount = $routes->count();
        $busTypeCount = BusType::query()->count();
        $activeBusCount = BusUnit::query()->where('is_active', true)->count();
        $upcomingScheduleCount = Availability::query()
            ->where('av_status', 'active')
            ->whereDate('av_date', '>=', $today->toDateString())
            ->whereDate('av_date', '<=', $today->copy()->addDays(7)->toDateString())
            ->count();
        $activeTemplateCount = ScheduleTemplate::query()->where('is_active', true)->count();

        $data = [
            $this->item('terminal', 'Terminal', $stationCount ? 'ok' : 'kosong', "{$stationCount} terminal tersedia.", [], '/admin/terminal'),
            $this->item('rute', 'Rute', $routeCount ? 'ok' : 'kosong', "{$routeCount} rute tersedia.", [], '/admin/rute'),
            $this->item(
                'titik_pemberhentian',
                'Titik pemberhentian',
                $readyRoutes === 0 ? 'kosong' : (count($unreadyRoutes) ? 'peringatan' : 'ok'),
                "{$readyRoutes} dari {$routeCount} rute siap dipakai.",
                $unreadyRoutes,
                '/admin/rute',
            ),
            $this->item('jenis_bus', 'Jenis bus', $busTypeCount ? 'ok' : 'kosong', "{$busTypeCount} jenis bus tersedia.", [], '/admin/tipe-bus'),
            $this->item('armada_aktif', 'Armada aktif', $activeBusCount ? 'ok' : 'kosong', "{$activeBusCount} armada aktif.", [], '/admin/armada'),
            $this->item('jadwal_mendatang', 'Jadwal mendatang', $upcomingScheduleCount ? 'ok' : 'kosong', "{$upcomingScheduleCount} jadwal aktif dalam 7 hari ke depan.", [], '/admin/jadwal'),
            $this->item(
                'jadwal_tetap',
                'Jadwal tetap',
                $activeTemplateCount ? 'ok' : 'peringatan',
                $activeTemplateCount ? "{$activeTemplateCount} jadwal tetap aktif." : 'Belum ada jadwal tetap aktif.',
                [],
                '/admin/jadwal-tetap',
            ),
        ];

        $readyForSale = collect($data)
            ->filter(fn (array $item) => $item['kunci'] !== 'jadwal_tetap')
            ->every(fn (array $item) => $item['status'] === 'ok');

        return response()->json([
            'data' => $data,
            'siap_jual' => $readyForSale,
        ]);
    }

    private function item(string $key, string $label, string $status, string $summary, array $detail, string $link): array
    {
        return [
            'kunci' => $key,
            'label' => $label,
            'status' => $status,
            'ringkasan' => $summary,
            'detail' => $detail,
            'tautan' => $link,
        ];
    }
}
