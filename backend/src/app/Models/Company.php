<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'company';
    protected $primaryKey = 'company_id';
    const UPDATED_AT = null; // tabel cuma punya created_at, tidak ada updated_at

    protected $fillable = ['co_name', 'co_address', 'co_phone', 'co_email'];

    public function busTypes()
    {
        return $this->hasMany(BusType::class, 'company_id', 'company_id');
    }
}
