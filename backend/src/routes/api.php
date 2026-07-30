<?php

use App\Http\Controllers\Api\Admin\AdminJadwalController;
use App\Http\Controllers\Api\Admin\AdminPesanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\KursiController;
use App\Http\Controllers\Api\PaypalController;
use App\Http\Controllers\Api\PesanController;
use App\Http\Controllers\Api\WilayahController;
use Illuminate\Support\Facades\Route;

// Auth (dipakai admin untuk login ke panel admin)
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

// Panel admin: hanya bisa diakses user yang sudah login DAN usr_role = admin
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/jadwal-options', [AdminJadwalController::class, 'options']);
    Route::get('/jadwal', [AdminJadwalController::class, 'index']);
    Route::post('/jadwal', [AdminJadwalController::class, 'store']);
    Route::put('/jadwal/{id}', [AdminJadwalController::class, 'update']);
    Route::delete('/jadwal/{id}', [AdminJadwalController::class, 'destroy']);

    Route::get('/pesan', [AdminPesanController::class, 'index']);
    Route::patch('/pesan/{id}/baca', [AdminPesanController::class, 'tandaiDibaca']);
    Route::delete('/pesan/{id}', [AdminPesanController::class, 'destroy']);
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