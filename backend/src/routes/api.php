<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\PesanController;
use App\Http\Controllers\Api\WilayahController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

// Data publik
Route::get('/wilayah', [WilayahController::class, 'index']);
Route::get('/jadwal', [JadwalController::class, 'index']);
Route::get('/jadwal/{id}/kursi', [JadwalController::class, 'kursi']);

// Kontak
Route::post('/pesan', [PesanController::class, 'store']);
