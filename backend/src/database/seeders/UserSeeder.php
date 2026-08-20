<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Cuma bikin akun admin. Halaman login (Masuk.jsx di frontend) memang
     * khusus admin -- customer sama sekali tidak butuh login untuk booking
     * (checkout dilakukan sebagai guest, dicek ulang lewat bk_code + email
     * di /booking/lookup), jadi akun contoh 'customer' tidak diperlukan.
     *
     * Password 'password123' cuma dipakai kalau APP_ENV=local (development
     * di komputer sendiri, gampang diingat waktu testing). Kalau seeder ini
     * sampai dijalankan di server production (APP_ENV bukan 'local'),
     * password acak yang jauh lebih aman akan dibuat otomatis dan
     * ditampilkan SEKALI di layar terminal supaya kamu bisa catat, lalu
     * segera login dan gantilah dengan password pilihan kamu sendiri.
     */
    public function run(): void
    {
        $isLocal = app()->environment('local');

        $adminPassword = $isLocal ? 'password123' : Str::password(16);

        User::create([
            'usr_name' => 'Admin SeeBus',
            'usr_email' => 'admin@seebus.co.id',
            'usr_password_hash' => Hash::make($adminPassword),
            'usr_role' => 'admin',
        ]);

        if (! $isLocal) {
            $this->command?->warn('Password akun seeded (APP_ENV bukan local, dibuat acak):');
            $this->command?->warn("  admin@seebus.co.id -> {$adminPassword}");
            $this->command?->warn('Catat sekarang lalu segera login & ganti password ini. Tidak akan ditampilkan lagi.');
        }
    }
}
