<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $table = 'region';
    protected $primaryKey = 'region_id';
    public $timestamps = false;

    protected $fillable = ['rg_district', 'rg_city', 'rg_province'];

    public function stations()
    {
        return $this->hasMany(Station::class, 'region_id', 'region_id');
    }
}
