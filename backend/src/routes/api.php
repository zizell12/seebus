<?php

use App\Http\Controllers\Api\Admin\AdminBusTypeController;
use App\Http\Controllers\Api\Admin\AdminJadwalController;
use App\Http\Controllers\Api\Admin\AdminPesanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\KursiController;
use App\Http\Controllers\Api\PaypalController;
use App\Http\Controllers\Api\PesanController;
use App\Http\Controllers\Api\WilayahController;
use App\Http\Controllers\Api\Admin\AdminCompanyController;
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

    Route::get('/bus-type-options', [AdminBusTypeController::class, 'options']);
    Route::get('/bus-type', [AdminBusTypeController::class, 'index']);
    Route::post('/bus-type', [AdminBusTypeController::class, 'store']);
    Route::put('/bus-type/{id}', [AdminBusTypeController::class, 'update']);
    Route::delete('/bus-type/{id}', [AdminBusTypeController::class, 'destroy']);

    Route::get('/company-profile', [AdminCompanyController::class, 'show']);
    Route::put('/company-profile', [AdminCompanyController::class, 'update']);
});

// Booking publik (checkout bisa dipakai tamu maupun user login)
Route::post('/booking', [BookingController::class, 'store']);
Route::post('/paypal/create-order', [PaypalController::class, 'createOrder']);
Route::post('/paypal/capture-order', [PaypalController::class, 'captureOrder']);

// Cek/lanjutkan booking yang masih pending (halaman "Lanjutkan Pembayaran").
// Rate-limited supaya bk_code (8 karakter) tidak bisa di-brute-force.
Route::post('/booking/lookup', [BookingController::class, 'lookup'])
    ->middleware('throttle:10,1');

// Data publik
Route::get('/wilayah', [WilayahController::class, 'index']);
Route::get('/jadwal', [JadwalController::class, 'index']);
Route::get('/jadwal/{id}/kursi', [JadwalController::class, 'kursi']);
Route::post('/kursi/lock', [KursiController::class, 'lock']);
Route::post('/kursi/unlock', [KursiController::class, 'unlock']);
Route::get('/company-profile', [\App\Http\Controllers\Api\CompanyController::class, 'show']);

// Kontak
Route::post('/pesan', [PesanController::class, 'store']);