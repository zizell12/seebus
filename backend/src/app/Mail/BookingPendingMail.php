<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Dikirim SEKALI, segera setelah booking dibuat (bk_status masih 'pending'),
 * berisi kode booking + link "Lanjutkan Pembayaran" (lihat
 * BookingController::lookup dan halaman frontend LanjutkanPembayaran.jsx).
 *
 * Alasan email ini perlu ada: sebelum ini, kode booking cuma tampil sesaat
 * di response API lalu tidak pernah ditampilkan lagi di UI manapun. Customer
 * yang keluar dari halaman pembayaran (refresh, sinyal putus, dsb) tidak
 * mungkin mengharapkan mereka sempat mencatat/menghafal kode 8 karakter
 * seperti "SB-AB12CD34" - jadi kode itu WAJIB juga dikirim ke tempat yang
 * mereka masih bisa akses nanti, yaitu email.
 */
class BookingPendingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public string $lanjutkanUrl;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking->loadMissing([
            'contact',
            'availability.route.originStation',
            'availability.route.destinationStation',
            'availability.busType.company',
        ]);

        $frontendUrl = rtrim(config('services.frontend.url'), '/');
        $this->lanjutkanUrl = $frontendUrl . '/pemesanan/lanjutkan';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Selesaikan Pembayaran SeeBus - ' . $this->booking->bk_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-pending',
            with: [
                'booking' => $this->booking,
                'lanjutkanUrl' => $this->lanjutkanUrl,
            ],
        );
    }
}
