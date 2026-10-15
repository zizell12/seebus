<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingCancellationService
{
    public function cancel(Booking $booking, string $reason, string $refundMode, int $cancelledBy): array
    {
        return DB::transaction(function () use ($booking, $reason, $refundMode, $cancelledBy) {
            $locked = Booking::whereKey($booking->booking_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($locked->bk_status, ['expired', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking sudah tidak dapat dibatalkan.',
                ])->status(422);
            }

            if ($locked->bk_status === 'pending') {
                BookingStockReleaser::release($locked);
                $locked->update([
                    'bk_status' => 'cancelled',
                    'bk_cancelled_at' => now(),
                    'bk_cancel_reason' => $reason,
                    'bk_cancelled_by' => $cancelledBy,
                ]);

                return [
                    'status' => 'cancelled',
                    'refund_required' => false,
                    'refund_percent' => null,
                    'refund_amount' => 0,
                    'refund_usd' => 0,
                    'refund_id' => null,
                    'pembatalan' => [
                        'refund_persen' => null,
                        'refund_jumlah' => 0,
                        'refund_usd' => 0,
                        'refund_id' => null,
                    ],
                ];
            }

            if ($locked->bk_status !== 'paid') {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking tidak dapat dibatalkan.',
                ])->status(422);
            }

            if ($locked->bk_refunded_at || $locked->bk_paypal_refund_id) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking ini sudah pernah di-refund.',
                ])->status(422);
            }

            if (RefundPolicy::departure($locked)->isPast()) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking yang sudah berangkat tidak dapat dibatalkan.',
                ])->status(422);
            }

            $result = (new BookingRefundService)->cancelPaid($locked, $reason, $refundMode, $cancelledBy);
            return array_merge($result, ['data' => $result]);
        });
    }
}
