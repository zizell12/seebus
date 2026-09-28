<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking->loadMissing([
            'contact',
            'passengers.fromStop.station',
            'passengers.toStop.station',
            'availability.route.originStation',
            'availability.route.destinationStation',
            'availability.busUnit.busType.company',
        ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'E-Tiket SeeBus - ' . $this->booking->bk_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket',
            with: [
                'booking' => $this->booking,
            ],
        );
    }
}