<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'usr_name' => 'Admin SeeBus',
            'usr_email' => 'admin@seebus.co.id',
            'usr_password_hash' => Hash::make('password123'),
            'usr_role' => 'admin',
        ]);

        User::create([
            'usr_name' => 'Budi Customer',
            'usr_email' => 'customer@seebus.co.id',
            'usr_password_hash' => Hash::make('password123'),
            'usr_role' => 'customer',
        ]);
    }
}
