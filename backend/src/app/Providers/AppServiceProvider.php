<?php

namespace App\Providers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Kalau APP_DEBUG=true ketinggalan aktif di luar environment 'local'
        // (misalnya kelupaan pas deploy ke server), setiap error Laravel akan
        // menampilkan stack trace lengkap (isi query, path server, dst) ke
        // siapa saja yang mengaksesnya. Ini cuma jaring pengaman: tulis
        // peringatan yang jelas ke log supaya ketahuan, bukan mengubah
        // konfigurasi apa pun secara otomatis.
        if (! app()->environment('local', 'testing') && config('app.debug')) {
            Log::warning('APP_DEBUG=true aktif di environment non-local. Segera set APP_DEBUG=false di .env production untuk mencegah kebocoran detail error ke publik.');
        }
    }
}
