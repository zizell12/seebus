<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusType extends Model
{
    protected $table = 'bus_type';
    protected $primaryKey = 'bus_type_id';
    const UPDATED_AT = null;

    protected $fillable = ['company_id', 'bt_name', 'bt_capacity', 'bt_facilities'];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function availabilities()
    {
        return $this->hasMany(Availability::class, 'bus_type_id', 'bus_type_id');
    }
}
