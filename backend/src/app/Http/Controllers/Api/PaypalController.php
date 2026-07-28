<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TicketMail;
use App\Models\Booking;
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

        return Response::json(['data' => $response->json()]);
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

        $paypalUrl = config('services.paypal.base_url');
        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');

        $response = Http::withBasicAuth($clientId, $secret)
            ->withBody('{}', 'application/json')
            ->post("{$paypalUrl}/v2/checkout/orders/{$data['orderID']}/capture");

        if (! $response->successful()) {
            Log::error('PayPal capture gagal', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            return Response::json(['message' => 'Verifikasi PayPal gagal.', 'detail' => $response->json()], 500);
        }

        $captureData = $response->json();
        if ($captureData['status'] !== 'COMPLETED') {
            return response()->json(['message' => 'Pembayaran belum selesai.'], 422);
        }

        $booking->update([
            'bk_status' => 'paid',
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
        } else {
            Log::warning('Booking tidak memiliki email kontak, e-tiket tidak dikirim.', [
                'booking_id' => $booking->booking_id,
            ]);
        }

        return response()->json([
            'message' => 'Pembayaran berhasil.',
            'data' => $captureData,
        ]);
    }
}