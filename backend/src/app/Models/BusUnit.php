<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusUnit extends Model
{
    protected $table = 'bus_unit';
    protected $primaryKey = 'bus_unit_id';
    const UPDATED_AT = null;

    protected $fillable = ['bus_type_id', 'bu_code', 'bu_plate_number', 'bu_capacity', 'bu_facilities', 'is_active'];

    protected $casts = [
        'bu_facilities' => 'array',
        'is_active' => 'boolean',
    ];

    public function busType()
    {
        return $this->belongsTo(BusType::class, 'bus_type_id', 'bus_type_id');
    }

    public function availabilities()
    {
        return $this->hasMany(Availability::class, 'bus_unit_id', 'bus_unit_id');
    }
}
