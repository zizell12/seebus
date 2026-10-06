<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class BookingRefundService
{
    public function cancelPaid(Booking $booking, string $reason, string $mode, int $cancelledBy): array
    {
        return DB::transaction(function () use ($booking, $reason, $mode, $cancelledBy) {
            $locked = Booking::whereKey($booking->booking_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->bk_status !== 'paid') {
                throw ValidationException::withMessages([
                    'booking_status' => 'Hanya booking berstatus paid yang dapat diminta refund.',
                ])->status(422);
            }

            if ($locked->bk_refunded_at || $locked->bk_paypal_refund_id) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking ini sudah pernah di-refund.',
                ])->status(422);
            }

            if ($this->hasDeparted($locked)) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking yang sudah berangkat tidak dapat dibatalkan.',
                ])->status(422);
            }

            $captureId = $locked->bk_paypal_capture_id;
            if (empty($captureId) && ! empty($locked->bk_paypal_order_id)) {
                $captureId = $this->resolveCaptureId($locked->bk_paypal_order_id);
            }

            if (empty($captureId)) {
                throw ValidationException::withMessages([
                    'payPal_capture' => 'Capture PayPal tidak ditemukan untuk booking ini.',
                ])->status(409);
            }

            $percent = $this->refundPercent($locked, $mode);
            $refundAmount = $locked->bk_paid_usd * ($percent / 100);
            $now = now();

            if ($percent === 0) {
                $locked->update([
                    'bk_status' => 'cancelled',
                    'bk_cancelled_at' => $now,
                    'bk_cancel_reason' => $reason,
                    'bk_cancelled_by' => $cancelledBy,
                    'bk_paypal_capture_id' => $captureId,
                    'bk_refund_percent' => 0,
                    'bk_refund_amount' => 0,
                    'bk_refund_usd' => 0,
                ]);

                return [
                    'status' => 'cancelled',
                    'refund_required' => false,
                    'refund_percent' => 0,
                    'refund_amount' => 0,
                    'refund_status' => 'voided',
                ];
            }

            $response = Http::withBasicAuth(
                config('services.paypal.client_id'),
                config('services.paypal.secret')
            )->withHeader(
                'PayPal-Request-Id',
                "seebus-refund-{$locked->bk_code}-{$percent}"
            )->post(
                "{$this->paypalBaseUrl()}/v2/payments/captures/{$captureId}/refund",
                ['note' => $reason]
            );

            if (! $response->successful()) {
                throw new \RuntimeException('PayPal refund gagal: '.$response->body());
            }

            $refundData = $response->json();
            $paypalRefundId = data_get($refundData, 'id') ?? data_get($refundData, 'refund_id');
            if (empty($paypalRefundId)) {
                throw new \RuntimeException('PayPal refund tidak mengembalikan ID refund.');
            }

            $locked->update([
                'bk_status' => 'cancelled',
                'bk_cancelled_at' => $now,
                'bk_cancel_reason' => $reason,
                'bk_cancelled_by' => $cancelledBy,
                'bk_paypal_capture_id' => $captureId,
                'bk_refund_percent' => $percent,
                'bk_refund_amount' => $refundAmount,
                'bk_refund_usd' => $refundAmount,
                'bk_paypal_refund_id' => $paypalRefundId,
                'bk_refunded_at' => $now,
            ]);

            return [
                'status' => 'cancelled',
                'refund_required' => true,
                'refund_percent' => $percent,
                'refund_amount' => $refundAmount,
                'refund_status' => 'completed',
                'paypal_refund_id' => $paypalRefundId,
            ];
        });
    }

    private function refundPercent(Booking $booking, string $mode): int
    {
        if ($mode === 'penuh') {
            return config('refund.full_refund_percent', 100);
        }

        if ($mode !== 'kebijakan') {
            return 0;
        }

        $departure = $this->departureDateTime($booking);
        $window = config('refund.policy_window_hours', 24);
        $minimum = now()->addHours($window);

        return $departure && $departure->greaterThanOrEqualTo($minimum)
            ? config('refund.policy_percent', 75)
            : 0;
    }

    private function hasDeparted(Booking $booking): bool
    {
        $departure = $this->departureDateTime($booking);
        return ! $departure || $departure->isPast();
    }

    private function departureDateTime(Booking $booking): ?\Illuminate\Support\Carbon
    {
        $date = $booking->availability?->av_date;
        $time = $booking->availability?->av_time;
        if (! $date || ! $time) {
            return null;
        }

        $parts = explode(':', (string) $time);
        return $date->setTime((int) ($parts[0] ?? 0), (int) ($parts[1] ?? 0), 0);
    }

    private function resolveCaptureId(string $orderId): ?string
    {
        $response = Http::withBasicAuth(
            config('services.paypal.client_id'),
            config('services.paypal.secret')
        )->get("{$this->paypalBaseUrl()}/v2/checkout/orders/{$orderId}");

        if (! $response->successful()) {
            return null;
        }

        return data_get($response->json(), 'purchase_units.0.payments.captures.0.id');
    }

    private function paypalBaseUrl(): string
    {
        return rtrim(config('services.paypal.base_url'), '/');
    }
}
