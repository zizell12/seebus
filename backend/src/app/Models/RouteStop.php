<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RouteStop extends Model
{
    protected $table = 'route_stop';
    protected $primaryKey = 'route_stop_id';
    const UPDATED_AT = null;

    protected $fillable = [
        'route_id', 'station_id', 'stop_order', 'stop_type', 'offset_minutes',
        'fare_adult', 'fare_child', 'fare_infant',
    ];

    protected $casts = [
        'fare_adult' => 'decimal:2',
        'fare_child' => 'decimal:2',
        'fare_infant' => 'decimal:2',
    ];

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id', 'route_id');
    }

    public function station()
    {
        return $this->belongsTo(Station::class, 'station_id', 'station_id');
    }
}
