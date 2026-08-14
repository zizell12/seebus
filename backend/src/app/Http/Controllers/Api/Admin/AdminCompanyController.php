<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCompanyController extends Controller
{
    /**
     * GET /api/admin/company-profile
     * Ambil data profil perusahaan (selalu baris pertama, dibuat otomatis
     * kalau belum ada) untuk ditampilkan di form edit panel admin.
     */
    public function show(): JsonResponse
    {
        $company = Company::first() ?? Company::create(['co_name' => 'SeeBus']);

        return response()->json($company);
    }

    /**
     * PUT /api/admin/company-profile
     * Simpan perubahan profil perusahaan dari form panel admin.
     */
    public function update(Request $request): JsonResponse
    {
        $company = Company::first() ?? Company::create(['co_name' => 'SeeBus']);

        $data = $request->validate([
            'co_name' => 'required|string|max:150',
            'co_address' => 'nullable|string|max:255',
            'co_phone' => 'nullable|string|max:20',
            'co_email' => 'nullable|email|max:100',
            'co_badge_sejak' => 'nullable|string|max:50',
            'co_hero_judul_id' => 'nullable|string|max:200',
            'co_hero_judul_en' => 'nullable|string|max:200',
            'co_hero_deskripsi_id' => 'nullable|string',
            'co_hero_deskripsi_en' => 'nullable|string',
            'co_misi_kutipan_id' => 'nullable|string',
            'co_misi_kutipan_en' => 'nullable|string',
            'co_aman_judul_id' => 'nullable|string|max:200',
            'co_aman_judul_en' => 'nullable|string|max:200',
            'co_aman_deskripsi_id' => 'nullable|string',
            'co_aman_deskripsi_en' => 'nullable|string',
            'co_stat_armada' => 'nullable|string|max:20',
            'co_stat_rute' => 'nullable|string|max:20',
            'co_stat_penumpang' => 'nullable|string|max:20',
            'co_komitmen_judul_id' => 'nullable|string|max:200',
            'co_komitmen_judul_en' => 'nullable|string|max:200',
            'co_komitmen_deskripsi_id' => 'nullable|string',
            'co_komitmen_deskripsi_en' => 'nullable|string',
            'co_cs_phone' => 'nullable|string|max:20',
            'co_whatsapp' => 'nullable|string|max:20',
            'co_map_lat' => 'nullable|numeric|between:-90,90',
            'co_map_lng' => 'nullable|numeric|between:-180,180',
        ]);

        $company->update($data);

        return response()->json([
            'message' => 'Profil perusahaan berhasil diperbarui.',
            'data' => $company,
        ]);
    }
}