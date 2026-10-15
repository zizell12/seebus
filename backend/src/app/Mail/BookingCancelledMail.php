<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingCancelledMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    public bool $sudahDibayar;

    public function __construct(Booking $booking, bool $sudahDibayar = true)
    {
        $this->sudahDibayar = $sudahDibayar;
        $this->booking = $booking->loadMissing([
            'contact',
            'availability.route.originStation',
            'availability.route.destinationStation',
        ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Booking Dibatalkan SeeBus - ' . $this->booking->bk_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-cancelled',
            with: [
                'booking' => $this->booking,
                'sudahDibayar' => $this->sudahDibayar,
            ],
        );
    }
}
