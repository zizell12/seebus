<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    protected $table = 'seat';
    protected $primaryKey = 'seat_id';
    public $timestamps = false;

    protected $fillable = [
        'availability_id', 'seat_number', 'seat_status',
        'seat_locked_session', 'seat_locked_until',
    ];

    public function availability()
    {
        return $this->belongsTo(Availability::class, 'availability_id', 'availability_id');
    }

    public function passenger()
    {
        return $this->hasOne(Passenger::class, 'seat_id', 'seat_id');
    }
}
