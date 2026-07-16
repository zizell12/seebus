<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $table = 'booking';
    protected $primaryKey = 'booking_id';
    const UPDATED_AT = null;

    protected $fillable = [
        'bk_code', 'user_id', 'availability_id', 'contact_id',
        'bk_adult_count', 'bk_child_count', 'bk_infant_count',
        'bk_notes', 'bk_net_price', 'bk_publish_price', 'bk_total_price',
        'bk_status',
    ];

    protected static function booted()
    {
        static::creating(function ($booking) {
            if (empty($booking->bk_code)) {
                $booking->bk_code = 'SB-' . strtoupper(Str::random(8));
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function availability()
    {
        return $this->belongsTo(Availability::class, 'availability_id', 'availability_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contact_id', 'contact_id');
    }

    public function passengers()
    {
        return $this->hasMany(Passenger::class, 'booking_id', 'booking_id');
    }
}
