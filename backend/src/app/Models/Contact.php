<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $table = 'contact';
    protected $primaryKey = 'contact_id';
    public $timestamps = false;

    protected $fillable = ['ct_name', 'ct_email', 'ct_phone', 'ct_nationality'];

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'contact_id', 'contact_id');
    }
}
