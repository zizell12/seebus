<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TicketMail;
use App\Models\Booking;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Response;

class PaypalController extends Controller
{
    public function createOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => 'required|exists:booking,booking_id',
        ]);

        $booking = Booking::findOrFail($data['booking_id']);
        if ($booking->bk_status !== 'pending') {
            return Response::json(['message' => 'Booking harus berstatus pending sebelum membuat order.'], 422);
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
                            'value' => number_format($booking->bk_total_price / 15000, 2, '.', ''),
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
            'booking_id' => 'required|exists:booking,booking_id',
            'orderID' => 'required|string',
        ]);

        $booking = Booking::findOrFail($data['booking_id']);
        if ($booking->bk_status !== 'pending') {
            return Response::json(['message' => 'Booking harus pending sebelum capture pembayaran.'], 422);
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
        if ($booking->bk_status === 'paid') {
            return ['status' => 'COMPLETED'];
        }

        if ($booking->bk_status !== 'pending') {
            throw new \RuntimeException('Booking harus pending sebelum capture pembayaran.');
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

        $booking->update(['bk_status' => 'paid']);
        $seatIds = $booking->passengers()->pluck('seat_id');
        Seat::whereIn('seat_id', $seatIds)->update([
            'seat_status' => 'booked',
            'seat_locked_session' => null,
            'seat_locked_until' => null,
        ]);

        $booking->load('contact');
        $recipientEmail = $booking->contact?->ct_email;
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