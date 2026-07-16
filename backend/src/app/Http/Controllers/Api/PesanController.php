<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PesanKontak;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PesanController extends Controller
{
    /**
     * POST /api/pesan
     * Dipanggil dari form "Hubungi Kami" di frontend.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'pesan' => 'required|string',
        ]);

        $pesan = PesanKontak::create($data);

        return response()->json([
            'message' => 'Pesan berhasil dikirim.',
            'data' => $pesan,
        ], 201);
    }
}
