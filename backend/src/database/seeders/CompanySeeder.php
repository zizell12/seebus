<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * Proyek ini untuk 1 perusahaan bus saja (bukan marketplace banyak PO
     * mitra), jadi tabel company cuma boleh berisi 1 baris. Baris ini juga
     * yang otomatis dipakai sebagai "Profil Perusahaan" di panel admin
     * (lihat AdminCompanyController::show(), yang ambil Company::first()).
     *
     * co_name di sini cuma placeholder awal -- ganti lewat menu "Profil
     * Perusahaan" di panel admin setelah data asli perusahaan kamu siap.
     */
    public function run(): void
    {
        Company::firstOrCreate(
            ['co_name' => 'SeeBus'],
            [
                'co_address' => null,
                'co_phone' => null,
                'co_email' => null,
            ]
        );
    }
}