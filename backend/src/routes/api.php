<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\KursiController;
use App\Http\Controllers\Api\PaypalController;
use App\Http\Controllers\Api\PesanController;
use App\Http\Controllers\Api\WilayahController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/pesanan', [BookingController::class, 'index']);
});

// Booking publik (checkout bisa dipakai tamu maupun user login)
Route::post('/booking', [BookingController::class, 'store']);
Route::post('/paypal/create-order', [PaypalController::class, 'createOrder']);
Route::post('/paypal/capture-order', [PaypalController::class, 'captureOrder']);

// Data publik
Route::get('/wilayah', [WilayahController::class, 'index']);
Route::get('/jadwal', [JadwalController::class, 'index']);
Route::get('/jadwal/{id}/kursi', [JadwalController::class, 'kursi']);
Route::post('/kursi/lock', [KursiController::class, 'lock']);
Route::post('/kursi/unlock', [KursiController::class, 'unlock']);

// Kontak
Route::post('/pesan', [PesanController::class, 'store']);
