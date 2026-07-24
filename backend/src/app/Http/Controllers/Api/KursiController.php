<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KursiController extends Controller
{
    const LOCK_MINUTES = 15;

    /**
     * POST /api/kursi/lock
     * body: { availability_id, nomor_kursi: ["A1","B1"], session_id }
     */
    public function lock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'availability_id' => 'required|integer|exists:availability,availability_id',
            'nomor_kursi' => 'required|array|min:1',
            'nomor_kursi.*' => 'string',
            'session_id' => 'required|string|max:100',
        ]);

        $kursiTerkunci = DB::transaction(function () use ($data) {
            $seats = Seat::where('availability_id', $data['availability_id'])
                ->whereIn('seat_number', $data['nomor_kursi'])
                ->lockForUpdate()
                ->get();

            if ($seats->count() !== count($data['nomor_kursi'])) {
                throw ValidationException::withMessages([
                    'nomor_kursi' => 'Ada nomor kursi yang tidak ditemukan.',
                ]);
            }

            foreach ($seats as $seat) {
                $dikunciOrangLain = $seat->seat_status === 'locked'
                    && $seat->seat_locked_session !== $data['session_id']
                    && $seat->seat_locked_until > now();

                if ($seat->seat_status === 'booked' || $dikunciOrangLain) {
                    throw ValidationException::withMessages([
                        'nomor_kursi' => "Kursi {$seat->seat_number} sudah tidak tersedia.",
                    ]);
                }
            }

            $expiresAt = now()->addMinutes(self::LOCK_MINUTES);

            foreach ($seats as $seat) {
                $seat->update([
                    'seat_status' => 'locked',
                    'seat_locked_session' => $data['session_id'],
                    'seat_locked_until' => $expiresAt,
                ]);
            }

            return $seats;
        });

        return response()->json([
            'message' => 'Kursi berhasil dikunci sementara.',
            'berlaku_sampai' => now()->addMinutes(self::LOCK_MINUTES),
            'data' => $kursiTerkunci,
        ]);
    }

    /**
     * POST /api/kursi/unlock
     * body: { availability_id, nomor_kursi, session_id }
     */
    public function unlock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'availability_id' => 'required|integer',
            'nomor_kursi' => 'required|array|min:1',
            'session_id' => 'required|string',
        ]);

        Seat::where('availability_id', $data['availability_id'])
            ->whereIn('seat_number', $data['nomor_kursi'])
            ->where('seat_locked_session', $data['session_id'])
            ->update([
                'seat_status' => 'empty',
                'seat_locked_session' => null,
                'seat_locked_until' => null,
            ]);

        return response()->json(['message' => 'Kursi dilepas.']);
    }
}
