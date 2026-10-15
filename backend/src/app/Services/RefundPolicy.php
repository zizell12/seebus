<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Carbon;

class RefundPolicy
{
    public static function departure(Booking $booking): Carbon
    {
        $date = $booking->availability?->av_date;
        $time = $booking->availability?->av_time;
        if (! $date || ! $time) {
            throw new \RuntimeException('Jadwal booking tidak memiliki tanggal dan waktu berangkat.');
        }

        $parts = explode(':', (string) $time);
        return Carbon::parse($date->toDateString().' '.sprintf('%02d:%02d:00', (int) ($parts[0] ?? 0), (int) ($parts[1] ?? 0)));
    }

    public static function evaluate(Booking $booking, string $mode = 'kebijakan', ?Carbon $now = null): array
    {
        if (! in_array($mode, ['kebijakan', 'penuh'], true)) {
            throw new \InvalidArgumentException('Mode refund tidak valid.');
        }

        if ($mode === 'penuh') {
            return [
                'persen' => 100,
                'jumlah' => (float) $booking->bk_total_price,
                'jumlah_usd' => (float) $booking->bk_paid_usd,
                'jam_sebelum_berangkat' => null,
            ];
        }

        $departure = self::departure($booking);
        $now = $now ?? Carbon::now($departure->getTimezone());
        $hours = $now->diffInSeconds($departure) / 3600;
        $threshold = (int) config('refund.threshold_hours', 24);
        $percent = $hours >= $threshold
            ? (int) config('refund.percent_before_threshold', 75)
            : (int) config('refund.percent_within_threshold', 0);

        return [
            'persen' => $percent,
            'jumlah' => round((float) $booking->bk_total_price * ($percent / 100), 2),
            'jumlah_usd' => round((float) $booking->bk_paid_usd * ($percent / 100), 2),
            'jam_sebelum_berangkat' => max(0, round($hours, 2)),
        ];
    }
}
