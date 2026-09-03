<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;


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
