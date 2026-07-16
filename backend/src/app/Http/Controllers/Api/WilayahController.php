<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Region;
use Illuminate\Http\JsonResponse;

class WilayahController extends Controller
{
    /**
     * GET /api/wilayah
     * Daftar kota unik, dipakai buat dropdown "Dari" & "Tujuan" di frontend.
     */
    public function index(): JsonResponse
    {
        $kota = Region::select('rg_city')
            ->distinct()
            ->orderBy('rg_city')
            ->pluck('rg_city');

        return response()->json([
            'data' => $kota,
        ]);
    }
}
