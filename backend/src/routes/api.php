<?php

use App\Http\Controllers\Api\Admin\AdminBusTypeController;
use App\Http\Controllers\Api\Admin\AdminJadwalController;
use App\Http\Controllers\Api\Admin\AdminPesanController;
use App\Http\Controllers\Api\Admin\AdminRouteController;
use App\Http\Controllers\Api\Admin\AdminStationController;
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
// Rate-limited supaya password tidak bisa di-brute-force lewat percobaan
// login bertubi-tubi.
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:6,1');

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

    Route::get('/route-options', [AdminRouteController::class, 'options']);
    Route::get('/route', [AdminRouteController::class, 'index']);
    Route::post('/route', [AdminRouteController::class, 'store']);
    Route::put('/route/{id}', [AdminRouteController::class, 'update']);
    Route::delete('/route/{id}', [AdminRouteController::class, 'destroy']);

    Route::get('/station-options', [AdminStationController::class, 'options']);
    Route::get('/station', [AdminStationController::class, 'index']);
    Route::post('/station', [AdminStationController::class, 'store']);
    Route::put('/station/{id}', [AdminStationController::class, 'update']);
    Route::delete('/station/{id}', [AdminStationController::class, 'destroy']);

    Route::get('/company-profile', [AdminCompanyController::class, 'show']);
    Route::put('/company-profile', [AdminCompanyController::class, 'update']);
});

// Booking publik (checkout bisa dipakai tamu maupun user login).
// Rate-limited supaya endpoint ini tidak dibanjiri booking palsu secara
// otomatis (tiap booking bikin baris baru di database dan mengunci kursi
// selama 15 menit, jadi spam di sini juga "menyandera" ketersediaan kursi).
Route::post('/booking', [BookingController::class, 'store'])
    ->middleware('throttle:10,1');
// booking_id yang dipakai endpoint PayPal di bawah ini cuma angka urut biasa
// (gampang ditebak: 1, 2, 3, dst), jadi dirate-limit juga supaya endpoint ini
// tidak bisa dipakai untuk terus-menerus memicu pembuatan order PayPal
// (buang-buang kuota/biaya API PayPal) dengan booking_id yang ditebak-tebak.
Route::post('/paypal/create-order', [PaypalController::class, 'createOrder'])
    ->middleware('throttle:10,1');
Route::post('/paypal/capture-order', [PaypalController::class, 'captureOrder'])
    ->middleware('throttle:10,1');

// Cek/lanjutkan booking yang masih pending (halaman "Lanjutkan Pembayaran").
// Rate-limited supaya bk_code (8 karakter) tidak bisa di-brute-force.
Route::post('/booking/lookup', [BookingController::class, 'lookup'])
    ->middleware('throttle:10,1');

// Data publik
Route::get('/wilayah', [WilayahController::class, 'index']);
Route::get('/jadwal', [JadwalController::class, 'index']);
Route::get('/jadwal/{id}/kursi', [JadwalController::class, 'kursi']);
// Rate-limited supaya endpoint ini tidak disalahgunakan untuk terus-menerus
// mengunci semua kursi di satu jadwal (menghalangi pembeli asli booking),
// tanpa perlu login sama sekali.
Route::post('/kursi/lock', [KursiController::class, 'lock'])
    ->middleware('throttle:20,1');
Route::post('/kursi/unlock', [KursiController::class, 'unlock'])
    ->middleware('throttle:20,1');
Route::get('/company-profile', [\App\Http\Controllers\Api\CompanyController::class, 'show']);

// Kontak. Rate-limited supaya form "Hubungi Kami" tidak dibanjiri pesan
// spam otomatis.
Route::post('/pesan', [PesanController::class, 'store'])
    ->middleware('throttle:5,1');