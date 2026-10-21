<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    protected $table = 'route';
    protected $primaryKey = 'route_id';
    public $timestamps = false;

    protected $fillable = ['origin_station_id', 'destination_station_id', 'rt_distance_km', 'rt_duration_min'];

    public function originStation()
    {
        return $this->belongsTo(Station::class, 'origin_station_id', 'station_id');
    }

    public function destinationStation()
    {
        return $this->belongsTo(Station::class, 'destination_station_id', 'station_id');
    }

    public function availabilities()
    {
        return $this->hasMany(Availability::class, 'route_id', 'route_id');
    }

    public function stops()
    {
        return $this->hasMany(RouteStop::class, 'route_id', 'route_id')->orderBy('stop_order');
    }

    public function stopsProblems(): array
    {
        $stops = $this->stops;
        $problems = [];

        if ($stops->count() < 2) {
            $problems[] = 'Rute harus memiliki minimal 2 titik pemberhentian.';
        }

        $first = $stops->first();
        if ($first && (string) $first->station_id !== (string) $this->origin_station_id) {
            $problems[] = 'Titik pemberhentian pertama harus sama dengan asal rute.';
        }

        $last = $stops->last();
        if ($last && (string) $last->station_id !== (string) $this->destination_station_id) {
            $problems[] = 'Titik pemberhentian terakhir harus sama dengan tujuan rute.';
        }

        for ($i = 1; $i < $stops->count(); $i++) {
            if ((string) $stops[$i - 1]->station_id === (string) $stops[$i]->station_id) {
                $problems[] = 'Dua titik pemberhentian berurutan tidak boleh menggunakan stasiun yang sama.';
                break;
            }
        }

        return $problems;
    }

    public function isReadyForSchedule(): bool
    {
        return $this->stopsProblems() === [];
    }

    public function scheduleTemplates()
    {
        return $this->hasMany(ScheduleTemplate::class, 'route_id', 'route_id');
    }
}
