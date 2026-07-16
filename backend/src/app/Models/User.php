<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'user';
    protected $primaryKey = 'user_id';
    const UPDATED_AT = null;

    protected $fillable = ['usr_name', 'usr_email', 'usr_password_hash', 'usr_role'];

    protected $hidden = ['usr_password_hash'];

    /**
     * Laravel secara default mencari kolom "password" untuk auth.
     * Karena kolom kamu namanya "usr_password_hash", override method ini
     * supaya Laravel tahu harus baca dari kolom itu.
     */
    public function getAuthPassword()
    {
        return $this->usr_password_hash;
    }

    /**
     * Sama halnya untuk "name" dan "email" — beberapa bagian Laravel
     * (misal notifikasi) mengharapkan atribut ini, jadi kita alias-kan.
     */
    public function getNameAttribute()
    {
        return $this->usr_name;
    }

    public function getEmailAttribute()
    {
        return $this->usr_email;
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'user_id', 'user_id');
    }
}
