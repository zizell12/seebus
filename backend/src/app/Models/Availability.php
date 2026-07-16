<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Availability extends Model
{
    protected $table = 'availability';
    protected $primaryKey = 'availability_id';
    const UPDATED_AT = null;

    protected $fillable = [
        'route_id', 'bus_type_id', 'av_date', 'av_time',
        'av_price', 'av_status', 'av_seats',
    ];

    protected $casts = [
        'av_price' => 'array', // contoh isi: {"adult":150000,"child":100000}
        'av_date' => 'date',
    ];

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id', 'route_id');
    }

    public function busType()
    {
        return $this->belongsTo(BusType::class, 'bus_type_id', 'bus_type_id');
    }

    public function seats()
    {
        return $this->hasMany(Seat::class, 'availability_id', 'availability_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'availability_id', 'availability_id');
    }
}
