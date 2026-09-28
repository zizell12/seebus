<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Passenger extends Model
{
    protected $table = 'passenger';
    protected $primaryKey = 'passenger_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'from_stop_id', 'to_stop_id', 'ps_category', 'ps_name', 'ps_age',
        'ps_gender', 'ps_nationality',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }

    public function fromStop()
    {
        return $this->belongsTo(RouteStop::class, 'from_stop_id', 'route_stop_id');
    }

    public function toStop()
    {
        return $this->belongsTo(RouteStop::class, 'to_stop_id', 'route_stop_id');
    }
}
