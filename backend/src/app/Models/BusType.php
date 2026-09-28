<?php

namespace App\Models;

use App\Models\Concerns\NormalizesCase;
use Illuminate\Database\Eloquent\Model;

class BusType extends Model
{
    use NormalizesCase;

    protected $table = 'bus_type';
    protected $primaryKey = 'bus_type_id';
    const UPDATED_AT = null;

    protected $fillable = ['company_id', 'bt_name', 'bt_capacity'];
    protected $normalizedFields = ['bt_name'];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function busUnits()
    {
        return $this->hasMany(BusUnit::class, 'bus_type_id', 'bus_type_id');
    }
}
