<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PesanKontak extends Model
{
    protected $table = 'pesan_kontak';
    protected $primaryKey = 'pesan_id';
    const UPDATED_AT = null;

    protected $fillable = ['nama', 'email', 'pesan'];
}
