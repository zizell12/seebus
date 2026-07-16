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
}
