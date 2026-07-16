<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Passenger extends Model
{
    protected $table = 'passenger';
    protected $primaryKey = 'passenger_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'seat_id', 'ps_category', 'ps_name', 'ps_age',
        'ps_gender', 'ps_nationality',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class, 'seat_id', 'seat_id');
    }
}
