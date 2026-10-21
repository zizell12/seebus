<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\ScheduleTemplate;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

class JadwalTetapGenerator
{
    public function generate(int $hariKeDepan = 30, ?int $templateId = null): array
    {
        if ($hariKeDepan < 1 || $hariKeDepan > 60) {
            throw new InvalidArgumentException('Jumlah hari harus antara 1 dan 60.');
        }

        $timezone = config('app.timezone');
        $hariIni = Carbon::today($timezone);
        $sekarang = Carbon::now($timezone);
        $hasil = [
            'dibuat' => 0,
            'sudah_ada' => 0,
            'lewat_waktu' => 0,
            'bentrok' => 0,
            'template_dilewati' => 0,
        ];

        $templates = ScheduleTemplate::query()
            ->with(['route', 'busUnit'])
            ->where('is_active', true)
            ->when($templateId !== null, fn ($query) => $query->whereKey($templateId))
            ->get();

        foreach ($templates as $template) {
            $route = $template->route;
            $busUnit = $template->busUnit;

            if (! $route || ! $busUnit || ! $busUnit->is_active || ! $route->isReadyForSchedule()) {
                $hasil['template_dilewati']++;

                continue;
            }

            $daysOfWeek = array_map('intval', $template->days_of_week ?? []);
            $time = substr((string) $template->departure_time, 0, 8);

            for ($dayOffset = 0; $dayOffset < $hariKeDepan; $dayOffset++) {
                $tanggal = $hariIni->copy()->addDays($dayOffset);
                if (! in_array((int) $tanggal->dayOfWeek, $daysOfWeek, true)) {
                    continue;
                }

                $tanggalString = $tanggal->toDateString();
                $departure = Carbon::parse("{$tanggalString} {$time}", $timezone);

                $sudahAda = Availability::query()
                    ->where('route_id', $route->route_id)
                    ->where('bus_unit_id', $busUnit->bus_unit_id)
                    ->whereDate('av_date', $tanggalString)
                    ->where('av_time', $time)
                    ->exists();

                if ($sudahAda) {
                    $hasil['sudah_ada']++;

                    continue;
                }

                if ($departure->lt($sekarang)) {
                    $hasil['lewat_waktu']++;

                    continue;
                }

                if (BusUnitScheduleConflict::conflicts(
                    (int) $busUnit->bus_unit_id,
                    $tanggalString,
                    $time,
                    routeId: (int) $route->route_id,
                )) {
                    $hasil['bentrok']++;

                    continue;
                }

                AvailabilityGenerator::createAvailability($route, $busUnit, $tanggalString, $time);
                $hasil['dibuat']++;
            }
        }

        return $hasil;
    }
}
