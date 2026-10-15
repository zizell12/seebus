<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

            if (RefundPolicy::departure($locked)->isPast()) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Booking yang sudah berangkat tidak dapat dibatalkan.',
                ])->status(422);
            }

            $policy = RefundPolicy::evaluate($locked, $mode);
            $now = now();

            if ($policy['persen'] === 0) {
                $locked->update([
                    'bk_cancelled_at' => $now,
                    'bk_cancel_reason' => $reason,
                    'bk_cancelled_by' => $cancelledBy,
                    'bk_refund_percent' => 0,
                    'bk_refund_amount' => 0,
                    'bk_refund_usd' => 0,
                ]);
                BookingStockReleaser::release($locked);
                $locked->update(['bk_status' => 'cancelled']);
                return [
                    'status' => 'cancelled',
                    'refund_required' => false,
                    'refund_percent' => 0,
                    'refund_amount' => 0,
                    'refund_usd' => 0,
                    'refund_id' => null,
                    'refund_status' => 'voided',
                    'pembatalan' => [
                        'refund_persen' => 0,
                        'refund_jumlah' => 0,
                        'refund_usd' => 0,
                        'refund_id' => null,
                    ],
                ];
            }

            $captureId = $locked->bk_paypal_capture_id;
            $paidUsd = is_numeric($locked->bk_paid_usd) ? (float) $locked->bk_paid_usd : 0.0;
            if (empty($captureId) || $paidUsd <= 0) {
                if (empty($locked->bk_paypal_order_id)) {
                    Log::error('PayPal capture data unavailable for booking refund.', [
                        'booking_code' => $locked->bk_code,
                        'capture_id_missing' => empty($captureId),
                        'paid_usd_missing' => $paidUsd <= 0,
                    ]);
                    throw ValidationException::withMessages([
                        'paypal_refund' => 'Data pembayaran PayPal tidak lengkap. Refund perlu diproses manual.',
                    ])->status(409);
                }

                $resolved = $this->resolveCapture($locked->bk_paypal_order_id, $locked->bk_code);
                if (empty($captureId)) {
                    $captureId = $resolved['id'] ?? null;
                }
                if ($paidUsd <= 0 && is_numeric($resolved['amount_usd'] ?? null)) {
                    $paidUsd = (float) $resolved['amount_usd'];
                }
            }

            if (empty($captureId) || $paidUsd <= 0) {
                Log::error('PayPal capture data incomplete for booking refund.', [
                    'booking_code' => $locked->bk_code,
                    'capture_id_missing' => empty($captureId),
                    'paid_usd_missing' => $paidUsd <= 0,
                ]);
                throw ValidationException::withMessages([
                    'paypal_refund' => 'Data pembayaran PayPal tidak lengkap. Refund perlu diproses manual.',
                ])->status(409);
            }

            $locked->forceFill([
                'bk_paypal_capture_id' => $captureId,
                'bk_paid_usd' => $paidUsd,
            ])->saveQuietly();
            $policy = RefundPolicy::evaluate($locked, $mode);
            $locked->update([
                'bk_cancelled_at' => $now,
                'bk_cancel_reason' => $reason,
                'bk_cancelled_by' => $cancelledBy,
                'bk_refund_percent' => $policy['persen'],
                'bk_refund_amount' => $policy['jumlah'],
                'bk_refund_usd' => $policy['jumlah_usd'],
            ]);

            try {
                $response = Http::withBasicAuth(
                    config('services.paypal.client_id'),
                    config('services.paypal.secret')
                )->timeout(20)
                    ->withHeader('PayPal-Request-Id', "seebus-refund-{$locked->bk_code}-{$policy['persen']}")
                    ->withBody(json_encode([
                        'note_to_payer' => "Refund tiket {$locked->bk_code}",
                        'amount' => [
                            'currency_code' => 'USD',
                            'value' => number_format($policy['jumlah_usd'], 2, '.', ''),
                        ],
                    ]), 'application/json')
                    ->post("{$this->paypalBaseUrl()}/v2/payments/captures/{$captureId}/refund");
            } catch (ConnectionException $exception) {
                Log::error('PayPal refund request failed.', [
                    'booking_code' => $locked->bk_code,
                    'exception' => $exception::class,
                ]);
                throw ValidationException::withMessages([
                    'paypal_refund' => 'PayPal refund gagal.',
                ])->status(502);
            }

            if (! $response->successful()) {
                Log::error('PayPal refund returned an unsuccessful HTTP status.', [
                    'booking_code' => $locked->bk_code,
                    'http_status' => $response->status(),
                ]);
                throw ValidationException::withMessages([
                    'paypal_refund' => 'PayPal refund gagal.',
                ])->status(502);
            }

            $refundData = $response->json();
            $paypalRefundId = data_get($refundData, 'id');
            $refundStatus = data_get($refundData, 'status');
            if (empty($paypalRefundId) || ! is_string($refundStatus) || ! in_array(strtoupper($refundStatus), ['COMPLETED', 'PENDING'], true)) {
                Log::error('PayPal refund response did not confirm a valid refund.', [
                    'booking_code' => $locked->bk_code,
                    'http_status' => $response->status(),
                    'refund_id_present' => ! empty($paypalRefundId),
                    'refund_status' => is_string($refundStatus) ? $refundStatus : null,
                ]);
                throw ValidationException::withMessages([
                    'paypal_refund' => 'PayPal refund gagal dikonfirmasi.',
                ])->status(502);
            }

            BookingStockReleaser::release($locked);
            $locked->update([
                'bk_status' => 'cancelled',
                'bk_paypal_refund_id' => $paypalRefundId,
                'bk_refunded_at' => $now,
            ]);

            return [
                'status' => 'cancelled',
                'refund_required' => true,
                'refund_percent' => $policy['persen'],
                'refund_amount' => $policy['jumlah'],
                'refund_usd' => $policy['jumlah_usd'],
                'refund_id' => $paypalRefundId,
                'refund_status' => $refundStatus,
                'pembatalan' => [
                    'refund_persen' => $policy['persen'],
                    'refund_jumlah' => $policy['jumlah'],
                    'refund_usd' => $policy['jumlah_usd'],
                    'refund_id' => $paypalRefundId,
                    'refund_status' => $refundStatus,
                ],
            ];
        });
    }

    private function resolveCapture(string $orderId, string $bookingCode): array
    {
        try {
            $response = Http::withBasicAuth(
                config('services.paypal.client_id'),
                config('services.paypal.secret')
            )->timeout(20)->get("{$this->paypalBaseUrl()}/v2/checkout/orders/{$orderId}");
        } catch (ConnectionException $exception) {
            Log::error('PayPal order lookup failed while resolving a capture.', [
                'booking_code' => $bookingCode,
                'exception' => $exception::class,
            ]);
            return [];
        }

        if (! $response->successful()) {
            Log::error('PayPal order lookup returned an unsuccessful HTTP status.', [
                'booking_code' => $bookingCode,
                'http_status' => $response->status(),
            ]);
            return [];
        }

        $capture = data_get($response->json(), 'purchase_units.0.payments.captures.0', []);
        return [
            'id' => data_get($capture, 'id'),
            'amount_usd' => data_get($capture, 'amount.currency_code') === 'USD'
                ? data_get($capture, 'amount.value')
                : null,
        ];
    }

    private function paypalBaseUrl(): string
    {
        return rtrim(config('services.paypal.base_url'), '/');
    }
}
