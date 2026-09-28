<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailabilityLeg extends Model
{
    protected $table = 'availability_leg';
    protected $primaryKey = 'availability_leg_id';
    const UPDATED_AT = null;

    protected $fillable = ['availability_id', 'route_stop_id', 'seats_booked'];

    public function availability()
    {
        return $this->belongsTo(Availability::class, 'availability_id', 'availability_id');
    }

    public function routeStop()
    {
        return $this->belongsTo(RouteStop::class, 'route_stop_id', 'route_stop_id');
    }
}
