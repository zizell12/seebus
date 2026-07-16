<?php

namespace Database\Seeders;

use App\Models\Availability;
use App\Models\Seat;
use Illuminate\Database\Seeder;

class SeatSeeder extends Seeder
{
    public function run(): void
    {
        $columns = ['A', 'B', 'C', 'D'];

        Availability::with('busType')->chunk(50, function ($availabilities) use ($columns) {
            foreach ($availabilities as $availability) {
                $capacity = $availability->busType->bt_capacity ?? 32;
                $rows = (int) ceil($capacity / count($columns));

                $seatCount = 0;
                for ($row = 1; $row <= $rows; $row++) {
                    foreach ($columns as $col) {
                        if ($seatCount >= $capacity) {
                            break 2;
                        }

                        Seat::create([
                            'availability_id' => $availability->availability_id,
                            'seat_number' => "{$col}{$row}",
                            'seat_status' => 'empty',
                        ]);

                        $seatCount++;
                    }
                }
            }
        });
    }
}
