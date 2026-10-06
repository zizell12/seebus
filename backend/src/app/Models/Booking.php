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
        'bk_status', 'bk_paypal_order_id', 'bk_hold_until', 'bk_paid_at',
        'bk_paypal_capture_id', 'bk_paid_usd', 'bk_cancelled_at',
        'bk_cancel_reason', 'bk_cancelled_by', 'bk_refund_percent',
        'bk_refund_amount', 'bk_refund_usd', 'bk_paypal_refund_id',
        'bk_refunded_at',
    ];

    protected $casts = [
        'bk_hold_until' => 'datetime',
        'bk_paid_at' => 'datetime',
        'bk_cancelled_at' => 'datetime',
        'bk_refunded_at' => 'datetime',
        'bk_paid_usd' => 'decimal:2',
        'bk_refund_amount' => 'decimal:2',
        'bk_refund_usd' => 'decimal:2',
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
