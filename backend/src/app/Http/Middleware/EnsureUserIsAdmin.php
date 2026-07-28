<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Cuma boleh lewat kalau user sudah login (lewat middleware auth:sanctum
     * sebelumnya) DAN usr_role dia 'admin'. Kalau tidak, tolak dengan 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->usr_role !== 'admin') {
            return response()->json([
                'message' => 'Akses ditolak. Halaman ini khusus admin.',
            ], 403);
        }

        return $next($request);
    }
}