<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    protected $table = 'station';
    protected $primaryKey = 'station_id';
    public $timestamps = false;

    protected $fillable = ['region_id', 'stn_name', 'stn_address'];

    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id', 'region_id');
    }

    public function routesAsOrigin()
    {
        return $this->hasMany(Route::class, 'origin_station_id', 'station_id');
    }

    public function routesAsDestination()
    {
        return $this->hasMany(Route::class, 'destination_station_id', 'station_id');
    }
}
