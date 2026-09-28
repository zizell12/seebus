<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleTemplate extends Model
{
    protected $table = 'schedule_template';
    protected $primaryKey = 'schedule_template_id';
    const UPDATED_AT = null;

    protected $fillable = ['route_id', 'bus_unit_id', 'departure_time', 'days_of_week', 'is_active'];

    protected $casts = [
        'days_of_week' => 'array',
        'is_active' => 'boolean',
    ];

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id', 'route_id');
    }

    public function busUnit()
    {
        return $this->belongsTo(BusUnit::class, 'bus_unit_id', 'bus_unit_id');
    }
}
