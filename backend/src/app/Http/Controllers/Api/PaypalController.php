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

        return Response::json(['data' => $orderData]);
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

        // Kursi yang tadinya cuma 'locked' sementara (15 menit) sekarang dikunci
        // permanen sebagai 'booked', supaya tidak bisa dipesan orang lain lagi
        // walaupun proses pembayaran ini memakan waktu lebih dari masa lock awal.
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