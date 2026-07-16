<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            ['co_name' => 'Sinar Jaya', 'co_address' => 'Jakarta', 'co_phone' => '021-1234567', 'co_email' => 'cs@sinarjaya.co.id'],
            ['co_name' => 'Rosalia Indah', 'co_address' => 'Solo', 'co_phone' => '0271-1234567', 'co_email' => 'cs@rosaliaindah.co.id'],
            ['co_name' => 'Gunung Harta', 'co_address' => 'Denpasar', 'co_phone' => '0361-1234567', 'co_email' => 'cs@gunungharta.co.id'],
        ];

        foreach ($companies as $c) {
            Company::create($c);
        }
    }
}
