<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TicketMail;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Response;

class PaypalController extends Controller
{
    public function createOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bk_code' => 'required|string|max:20',
            'email' => 'required|email|max:100',
        ]);

        $booking = $this->findBooking($data['bk_code'], $data['email']);
        if (! $booking) {
            return Response::json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->bk_status !== 'pending') {
            return Response::json(['message' => 'Booking harus berstatus pending sebelum membuat order.'], 422);
        }
        if (! $booking->bk_hold_until || $booking->bk_hold_until->isPast()) {
            return Response::json(['message' => 'Waktu pembayaran booking sudah habis. Silakan buat booking baru.'], 410);
        }

        $exchangeRate = (int) config('services.paypal.usd_idr_rate');
        if ($exchangeRate < 1) {
            return Response::json(['message' => 'Kurs PayPal belum dikonfigurasi dengan benar.'], 500);
        }

        $paypalUrl = config('services.paypal.base_url');
        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');

        $response = Http::withBasicAuth($clientId, $secret)
            ->post("{$paypalUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'application_context' => [
                    'return_url' => $this->callbackUrl($booking, 'success'),
                    'cancel_url' => $this->callbackUrl($booking, 'cancel'),
                    'user_action' => 'PAY_NOW',
                ],
                'purchase_units' => [
                    [
                        'amount' => [
                            'currency_code' => 'USD',
                            'value' => number_format($booking->bk_total_price / $exchangeRate, 2, '.', ''),
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            Log::error('PayPal create order gagal', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            return Response::json(['message' => 'Gagal membuat order PayPal.', 'detail' => $response->json()], 500);
        }

        $orderData = $response->json();

        // Simpan orderID PayPal ini ke booking-nya. Wajib, supaya nanti saat
        // capture-order dipanggil kita bisa memverifikasi bahwa orderID yang
        // di-capture memang dibuat untuk booking_id ini, bukan orderID milik
        // booking lain yang "dipinjam" client untuk menandai booking lain
        // sebagai paid tanpa benar-benar membayar sejumlah harga booking itu.
        if (! empty($orderData['id'])) {
            $booking->update(['bk_paypal_order_id' => $orderData['id']]);
        }

        $approveUrl = collect($orderData['links'] ?? [])
            ->firstWhere('rel', 'approve')['href'] ?? null;

        if (! $approveUrl) {
            Log::error('PayPal create order tidak mengembalikan URL approval.', [
                'booking_id' => $booking->booking_id,
                'order_id' => $orderData['id'] ?? null,
            ]);

            return Response::json(['message' => 'URL pembayaran PayPal tidak tersedia.'], 500);
        }

        return Response::json(['data' => ['redirect_url' => $approveUrl]]);
    }

    public function callback(Request $request)
    {
        $orderId = $request->query('token');
        $booking = $orderId ? Booking::where('bk_paypal_order_id', $orderId)->first() : null;

        if (! $booking) {
            return redirect()->to($this->frontendUrl('/pemesanan/berhasil', [
                'status' => 'failed',
            ]));
        }

        if ($request->query('status') === 'cancel') {
            return redirect()->to($this->frontendUrl('/pemesanan/berhasil', [
                'status' => 'cancelled',
                'booking_id' => $booking->booking_id,
                'booking_code' => $booking->bk_code,
            ]));
        }

        try {
            $this->captureBooking($booking, $orderId);

            return redirect()->to($this->frontendUrl('/pemesanan/berhasil', [
                'status' => 'success',
                'booking_id' => $booking->booking_id,
                'booking_code' => $booking->bk_code,
            ]));
        } catch (\Throwable $e) {
            Log::error('Callback PayPal gagal memverifikasi pembayaran.', [
                'booking_id' => $booking->booking_id,
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return redirect()->to($this->frontendUrl('/pemesanan/berhasil', [
                'status' => 'failed',
                'booking_id' => $booking->booking_id,
                'booking_code' => $booking->bk_code,
            ]));
        }
    }

    public function captureOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bk_code' => 'required|string|max:20',
            'email' => 'required|email|max:100',
            'orderID' => 'required|string',
        ]);

        $booking = $this->findBooking($data['bk_code'], $data['email']);
        if (! $booking) {
            return Response::json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->bk_status !== 'pending') {
            return Response::json(['message' => 'Booking harus pending sebelum capture pembayaran.'], 422);
        }
        if (! $booking->bk_hold_until || $booking->bk_hold_until->isPast()) {
            return Response::json(['message' => 'Waktu pembayaran booking sudah habis. Silakan buat booking baru.'], 410);
        }

        // Penting: orderID yang mau di-capture HARUS sama dengan orderID yang
        // tercatat dibuat khusus untuk booking ini (lihat createOrder di
        // atas). Tanpa pengecekan ini, orderID PayPal yang sudah COMPLETED
        // untuk booking lain (misalnya booking murah) bisa "dipinjam" lewat
        // request ini dengan booking_id yang berbeda (booking lain, lebih
        // mahal) untuk menandainya paid begitu saja tanpa benar-benar
        // membayar sejumlah harga booking tersebut.
        if (empty($booking->bk_paypal_order_id) || $booking->bk_paypal_order_id !== $data['orderID']) {
            Log::warning('Percobaan capture PayPal dengan orderID yang tidak cocok untuk booking ini', [
                'booking_id' => $booking->booking_id,
                'orderID_diminta' => $data['orderID'],
                'orderID_tercatat' => $booking->bk_paypal_order_id,
            ]);

            return Response::json([
                'message' => 'orderID tidak cocok dengan booking ini.',
            ], 403);
        }

        $captureData = $this->captureBooking($booking, $data['orderID']);

        return response()->json([
            'message' => 'Pembayaran berhasil.',
            'data' => $captureData,
        ]);
    }

    private function captureBooking(Booking $booking, string $orderId): array
    {
        [$captureData, $wasCaptured] = DB::transaction(function () use ($booking, $orderId) {
            $lockedBooking = Booking::whereKey($booking->booking_id)->lockForUpdate()->firstOrFail();
            if ($lockedBooking->bk_status === 'paid') {
            return [['status' => 'COMPLETED'], false];
            }
            if ($lockedBooking->bk_status !== 'pending' || ! $lockedBooking->bk_hold_until || $lockedBooking->bk_hold_until->isPast()) {
                throw new \RuntimeException('Booking tidak lagi dapat dibayar.');
            }

            $paypalUrl = config('services.paypal.base_url');
            $response = Http::withBasicAuth(config('services.paypal.client_id'), config('services.paypal.secret'))
                ->withBody('{}', 'application/json')
                ->post("{$paypalUrl}/v2/checkout/orders/{$orderId}/capture");

            if (! $response->successful()) {
                throw new \RuntimeException('PayPal capture gagal: '.$response->body());
            }

            $captureData = $response->json();
            if (($captureData['status'] ?? null) !== 'COMPLETED') {
                throw new \RuntimeException('Pembayaran belum selesai.');
            }

            $captureId = data_get($captureData, 'purchase_units.0.payments.captures.0.id');
            $paidUsd = data_get($captureData, 'purchase_units.0.payments.captures.0.amount.value');
            $lockedBooking->update([
                'bk_status' => 'paid',
                'bk_paid_at' => now(),
                'bk_paypal_capture_id' => $captureId,
                'bk_paid_usd' => $paidUsd,
            ]);

            return [$captureData, true];
        });

        $booking->refresh();
        if ($wasCaptured) {
            $booking->load('contact');
            $recipientEmail = $booking->contact?->ct_email;
        } else {
            $recipientEmail = null;
        }
        if ($recipientEmail) {
            try {
                Mail::to($recipientEmail)->send(new TicketMail($booking));
            } catch (\Throwable $e) {
                Log::error('Gagal mengirim e-tiket ke email penumpang', [
                    'booking_id' => $booking->booking_id,
                    'email' => $recipientEmail,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $captureData;
    }

    private function findBooking(string $bookingCode, string $email): ?Booking
    {
        return Booking::where('bk_code', strtoupper(trim($bookingCode)))
            ->whereHas('contact', fn ($query) => $query->whereRaw('LOWER(ct_email) = ?', [strtolower(trim($email))]))
            ->first();
    }

    private function callbackUrl(Booking $booking, string $status): string
    {
        return url('/api/paypal/callback').'?'.http_build_query([
            'booking_id' => $booking->booking_id,
            'booking_code' => $booking->bk_code,
            'status' => $status,
        ]);
    }

    private function frontendUrl(string $path, array $query = []): string
    {
        $url = rtrim(config('services.frontend.url'), '/').$path;
        return $query ? $url.'?'.http_build_query($query) : $url;
    }
}