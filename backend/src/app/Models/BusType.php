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

    protected $fillable = ['company_id', 'bt_name', 'bt_capacity', 'bt_use_seat_number', 'bt_seat_pattern'];

    protected $normalizedFields = ['bt_name', 'bt_seat_pattern'];

    protected $casts = [
        'bt_use_seat_number' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function busUnits()
    {
        return $this->hasMany(BusUnit::class, 'bus_type_id', 'bus_type_id');
    }
}
