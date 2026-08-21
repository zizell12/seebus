<?php

namespace Database\Seeders;

use App\Models\BusType;
use App\Models\Company;
use Illuminate\Database\Seeder;

class BusTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Proyek ini cuma 1 perusahaan (lihat CompanySeeder), jadi semua tipe
        // bus contoh di bawah ditempelkan ke satu-satunya company itu -- bukan
        // ke banyak PO yang berbeda-beda seperti sebelumnya.
        $company = Company::first();

        // Setiap kategori (Ekonomi, Eksekutif, Sleeper) sengaja dibuat lebih dari
        // satu tipe bus dengan kombinasi fasilitas berbeda-beda, supaya filter
        // tipe bus & filter fasilitas di halaman pencarian benar-benar punya
        // variasi data untuk dicoba.
        $busTypes = [
            // Ekonomi
            ['bt_name' => 'Ekonomi', 'bt_capacity' => 40, 'bt_facilities' => 'ac, Kursi Standar 2-3'],
            ['bt_name' => 'Ekonomi', 'bt_capacity' => 40, 'bt_facilities' => 'ac, snack, Kursi Standar 2-3'],
            ['bt_name' => 'Ekonomi', 'bt_capacity' => 40, 'bt_facilities' => 'ac, wifi, Kursi Standar 2-3'],

            // Eksekutif
            ['bt_name' => 'Eksekutif', 'bt_capacity' => 30, 'bt_facilities' => 'ac, wifi, Reclining Seat, Bantal & Selimut'],
            ['bt_name' => 'Eksekutif', 'bt_capacity' => 30, 'bt_facilities' => 'ac, snack, Reclining Seat, Toilet'],
            ['bt_name' => 'Eksekutif', 'bt_capacity' => 30, 'bt_facilities' => 'ac, wifi, snack, Reclining Seat, Toilet, Bantal & Selimut'],

            // Sleeper
            ['bt_name' => 'Sleeper', 'bt_capacity' => 20, 'bt_facilities' => 'ac, wifi, snack, Kasur Individu, USB Charger'],
            ['bt_name' => 'Sleeper', 'bt_capacity' => 20, 'bt_facilities' => 'ac, snack, Kasur Individu, Legrest, Selimut'],
            ['bt_name' => 'Sleeper', 'bt_capacity' => 20, 'bt_facilities' => 'ac, wifi, Kasur Individu, USB Charger, Selimut'],
        ];

        foreach ($busTypes as $b) {
            BusType::create([
                'company_id' => $company->company_id,
                'bt_name' => $b['bt_name'],
                'bt_capacity' => $b['bt_capacity'],
                'bt_facilities' => $b['bt_facilities'],
            ]);
        }
    }
}