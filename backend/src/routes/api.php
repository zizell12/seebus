<?php

use App\Http\Controllers\Api\Admin\AdminBusTypeController;
use App\Http\Controllers\Api\Admin\AdminBookingController;
use App\Http\Controllers\Api\Admin\AdminBusUnitController;
use App\Http\Controllers\Api\Admin\AdminJadwalController;
use App\Http\Controllers\Api\Admin\AdminPesanController;
use App\Http\Controllers\Api\Admin\AdminRouteController;
use App\Http\Controllers\Api\Admin\AdminRouteStopController;
use App\Http\Controllers\Api\Admin\AdminStationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\PaypalController;
use App\Http\Controllers\Api\PesanController;
use App\Http\Controllers\Api\WilayahController;
use Illuminate\Support\Facades\Route;

// Auth (dipakai admin untuk login ke panel admin)
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
    Route::post('/jadwal/generate', [AdminJadwalController::class, 'generate']);
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

    Route::get('/bus-unit-options', [AdminBusUnitController::class, 'options']);
    Route::get('/bus-unit', [AdminBusUnitController::class, 'index']);
    Route::post('/bus-unit', [AdminBusUnitController::class, 'store']);
    Route::put('/bus-unit/{id}', [AdminBusUnitController::class, 'update']);
    Route::patch('/bus-unit/{id}/status', [AdminBusUnitController::class, 'toggleStatus']);
    Route::delete('/bus-unit/{id}', [AdminBusUnitController::class, 'destroy']);

    Route::get('/booking/rekap', [AdminBookingController::class, 'rekap']);
    Route::get('/booking/export', [AdminBookingController::class, 'export']);

    Route::get('/route-options', [AdminRouteController::class, 'options']);
    Route::get('/route', [AdminRouteController::class, 'index']);
    Route::post('/route', [AdminRouteController::class, 'store']);
    Route::put('/route/{id}', [AdminRouteController::class, 'update']);
    Route::delete('/route/{id}', [AdminRouteController::class, 'destroy']);

    Route::get('/route/{routeId}/stops', [AdminRouteStopController::class, 'index']);
    Route::post('/route/{routeId}/stops', [AdminRouteStopController::class, 'store']);
    Route::put('/route/{routeId}/stops/{stopId}', [AdminRouteStopController::class, 'update']);
    Route::delete('/route/{routeId}/stops/{stopId}', [AdminRouteStopController::class, 'destroy']);

    Route::get('/station-options', [AdminStationController::class, 'options']);
    Route::get('/station', [AdminStationController::class, 'index']);
    Route::post('/station', [AdminStationController::class, 'store']);
    Route::put('/station/{id}', [AdminStationController::class, 'update']);
    Route::delete('/station/{id}', [AdminStationController::class, 'destroy']);
});

// Booking publik (checkout bisa dipakai tamu maupun user login).
// Rate-limited supaya endpoint ini tidak dibanjiri booking palsu secara
Route::post('/booking', [BookingController::class, 'store'])
    ->middleware('throttle:10,1');

Route::post('/paypal/create-order', [PaypalController::class, 'createOrder'])
    ->middleware('throttle:10,1');
Route::get('/paypal/callback', [PaypalController::class, 'callback'])
    ->middleware('throttle:20,1');
Route::post('/paypal/capture-order', [PaypalController::class, 'captureOrder'])
    ->middleware('throttle:10,1');

// booking yang masih pending (halaman "Lanjutkan Pembayaran").
// Rate-limited supaya bk_code (8 karakter) tidak bisa di-brute-force.
Route::post('/booking/lookup', [BookingController::class, 'lookup'])
    ->middleware('throttle:10,1');

// Data publik
Route::get('/wilayah', [WilayahController::class, 'index']);
Route::get('/jadwal', [JadwalController::class, 'index']);
// Daftar titik naik/turun + sisa stok & harga untuk satu jadwal -- gantinya
// endpoint peta kursi (/jadwal/{id}/kursi) yang sudah tidak relevan lagi
// sejak nomor kursi dihapus (lihat poin 5 revisi: stok, bukan nomor kursi).
Route::get('/jadwal/{id}/titik-pemberhentian', [JadwalController::class, 'titikPemberhentian']);
Route::get('/company-profile', [\App\Http\Controllers\Api\CompanyController::class, 'show']);

// Kontak. Rate-limited supaya form "Hubungi Kami" tidak dibanjiri pesan
// spam otomatis.
Route::post('/pesan', [PesanController::class, 'store'])
    ->middleware('throttle:5,1');