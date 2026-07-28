<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>E-Tiket SeeBus</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, Helvetica, sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                    <tr>
                        <td style="background-color:#1d4ed8; padding:24px 32px;">
                            <span style="color:#ffffff; font-size:20px; font-weight:bold;">SeeBus</span>
                            <div style="color:#dbeafe; font-size:13px; margin-top:4px;">E-Tiket Perjalanan Anda</div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px 0 32px;">
                            <p style="margin:0 0 4px 0; font-size:13px; color:#6b7280;">Kode Booking</p>
                            <p style="margin:0; font-size:22px; font-weight:bold; letter-spacing:1px; color:#1d4ed8;">
                                {{ $booking->bk_code }}
                            </p>
                            <p style="margin:8px 0 0 0; font-size:13px; color:#059669; font-weight:bold;">
                                Status: Pembayaran Berhasil
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:6px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <p style="margin:0 0 2px 0; font-size:12px; color:#6b7280;">Rute</p>
                                        <p style="margin:0; font-size:16px; font-weight:bold;">
                                            {{ $booking->availability?->route?->originStation?->stn_name ?? '-' }}
                                            &rarr;
                                            {{ $booking->availability?->route?->destinationStation?->stn_name ?? '-' }}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 16px 16px 16px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size:12px; color:#6b7280; width:50%;">Tanggal Berangkat</td>
                                                <td style="font-size:12px; color:#6b7280;">Jam Berangkat</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size:14px; font-weight:bold;">
                                                    {{ optional($booking->availability?->av_date)->translatedFormat('d F Y') ?? '-' }}
                                                </td>
                                                <td style="font-size:14px; font-weight:bold;">
                                                    {{ $booking->availability?->av_time ?? '-' }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 16px 16px 16px;">
                                        <p style="margin:0; font-size:12px; color:#6b7280;">Armada</p>
                                        <p style="margin:0; font-size:14px; font-weight:bold;">
                                            {{ $booking->availability?->busType?->company?->co_name ?? '-' }}
                                            &mdash;
                                            {{ $booking->availability?->busType?->bt_name ?? '-' }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px 20px 32px;">
                            <p style="margin:0 0 8px 0; font-size:14px; font-weight:bold;">Data Penumpang</p>
                            <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
                                <tr style="background-color:#f9fafb;">
                                    <td style="border:1px solid #e5e7eb;"><strong>Nama</strong></td>
                                    <td style="border:1px solid #e5e7eb;"><strong>Kursi</strong></td>
                                    <td style="border:1px solid #e5e7eb;"><strong>Kategori</strong></td>
                                </tr>
                                @foreach ($booking->passengers as $passenger)
                                    <tr>
                                        <td style="border:1px solid #e5e7eb;">{{ $passenger->ps_name }}</td>
                                        <td style="border:1px solid #e5e7eb;">{{ $passenger->seat?->seat_number ?? '-' }}</td>
                                        <td style="border:1px solid #e5e7eb; text-transform:capitalize;">{{ $passenger->ps_category }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px 24px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-size:13px; color:#6b7280;">Atas Nama</td>
                                    <td style="font-size:13px; color:#6b7280; text-align:right;">Total Pembayaran</td>
                                </tr>
                                <tr>
                                    <td style="font-size:15px; font-weight:bold;">{{ $booking->contact?->ct_name ?? '-' }}</td>
                                    <td style="font-size:15px; font-weight:bold; text-align:right;">
                                        Rp {{ number_format($booking->bk_total_price, 0, ',', '.') }}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#f9fafb; padding:16px 32px; font-size:12px; color:#6b7280;">
                            Tunjukkan e-tiket ini (kode booking) saat check-in di loket keberangkatan.
                            Terima kasih telah memesan bersama SeeBus.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>