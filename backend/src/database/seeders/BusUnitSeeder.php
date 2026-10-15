<?php

namespace Database\Seeders;

use App\Models\BusType;
use App\Models\BusUnit;
use Illuminate\Database\Seeder;

class BusUnitSeeder extends Seeder
{
    public function run(): void
    {
        $unitsByClass = [
            'Ekonomi' => [
                ['bu_code' => 'Ekonomi Unit 1', 'bu_plate_number' => 'B 7001 SB', 'bu_capacity' => 40, 'bu_facilities' => ['ac']],
                ['bu_code' => 'Ekonomi Unit 2', 'bu_plate_number' => 'B 7002 SB', 'bu_capacity' => 40, 'bu_facilities' => ['ac', 'snack']],
                ['bu_code' => 'Ekonomi Unit 3', 'bu_plate_number' => 'B 7003 SB', 'bu_capacity' => 40, 'bu_facilities' => ['ac', 'wifi']],
            ],
            'Eksekutif' => [
                ['bu_code' => 'Eksekutif Unit 1', 'bu_plate_number' => 'B 7101 SB', 'bu_capacity' => 30, 'bu_facilities' => ['ac', 'wifi', 'reclining seat', 'bantal & selimut']],
                ['bu_code' => 'Eksekutif Unit 2', 'bu_plate_number' => 'B 7102 SB', 'bu_capacity' => 30, 'bu_facilities' => ['ac', 'snack', 'reclining seat', 'toilet']],
                ['bu_code' => 'Eksekutif Unit 3', 'bu_plate_number' => 'B 7103 SB', 'bu_capacity' => 30, 'bu_facilities' => ['ac', 'wifi', 'snack', 'reclining seat', 'toilet', 'bantal & selimut']],
            ],
            'Sleeper' => [
                ['bu_code' => 'Sleeper Unit 1', 'bu_plate_number' => 'B 7201 SB', 'bu_capacity' => 20, 'bu_facilities' => ['ac', 'wifi', 'snack', 'kasur individu', 'usb charger']],
                ['bu_code' => 'Sleeper Unit 2', 'bu_plate_number' => 'B 7202 SB', 'bu_capacity' => 20, 'bu_facilities' => ['ac', 'snack', 'kasur individu', 'legrest']],
                ['bu_code' => 'Sleeper Unit 3', 'bu_plate_number' => 'B 7203 SB', 'bu_capacity' => 20, 'bu_facilities' => ['ac', 'wifi', 'kasur individu', 'usb charger']],
            ],
        ];

        foreach ($unitsByClass as $namaKelas => $units) {
            $busType = BusType::where('bt_name', $namaKelas)->first();

            if (! $busType) {
                continue;
            }

            foreach ($units as $unit) {
                BusUnit::firstOrCreate(
                    ['bus_type_id' => $busType->bus_type_id, 'bu_code' => $unit['bu_code']],
                    [
                        'bu_plate_number' => $unit['bu_plate_number'],
                        'bu_capacity' => $unit['bu_capacity'],
                        'bu_facilities' => $unit['bu_facilities'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
