<?php

namespace App\Console\Commands;

use App\Services\JadwalTetapGenerator;
use Illuminate\Console\Command;

class GenerateJadwalTetap extends Command
{
    protected $signature = 'jadwal:generate-tetap {--hari=30}';

    protected $description = 'Buat jadwal dari template jadwal tetap yang aktif.';

    public function handle(JadwalTetapGenerator $generator): int
    {
        $hasil = $generator->generate((int) $this->option('hari'));

        $this->info(sprintf(
            'Jadwal tetap: dibuat %d, sudah ada %d, lewat waktu %d, bentrok %d, template dilewati %d.',
            $hasil['dibuat'],
            $hasil['sudah_ada'],
            $hasil['lewat_waktu'],
            $hasil['bentrok'],
            $hasil['template_dilewati'],
        ));

        return self::SUCCESS;
    }
}
