<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'company';
    protected $primaryKey = 'company_id';
    const UPDATED_AT = null;

    protected $fillable = [
        'co_name', 'co_address', 'co_phone', 'co_email',
        'co_badge_sejak',
        'co_hero_judul_id', 'co_hero_judul_en',
        'co_hero_deskripsi_id', 'co_hero_deskripsi_en',
        'co_misi_kutipan_id', 'co_misi_kutipan_en',
        'co_aman_judul_id', 'co_aman_judul_en',
        'co_aman_deskripsi_id', 'co_aman_deskripsi_en',
        'co_stat_armada', 'co_stat_rute', 'co_stat_penumpang',
        'co_komitmen_judul_id', 'co_komitmen_judul_en',
        'co_komitmen_deskripsi_id', 'co_komitmen_deskripsi_en',
        'co_cs_phone', 'co_whatsapp',
        'co_map_lat', 'co_map_lng',
    ];

    public function busTypes()
    {
        return $this->hasMany(BusType::class, 'company_id', 'company_id');
    }
}