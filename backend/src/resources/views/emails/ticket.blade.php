<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Tiket SeeBus</title>
</head>
<body style="margin:0; padding:0; background-color:#eef1f6; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color:#0F2A66;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f6; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#0F2A66; background:linear-gradient(135deg,#0F2A66,#15347D); border-radius:16px 16px 0 0; padding:28px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <span style="color:#ffffff; font-size:22px; font-weight:800; letter-spacing:0.5px;">SeeBus</span>
                                        <div style="color:#a9bce0; font-size:12.5px; margin-top:2px;">E-Tiket Perjalanan Anda</div>
                                    </td>
                                    <td align="right">
                                        <span style="display:inline-block; background-color:rgba(27,169,176,0.18); color:#7fe0e5; font-size:11px; font-weight:700; letter-spacing:0.5px; padding:6px 12px; border-radius:999px; text-transform:uppercase;">
                                            &#10003; Pembayaran Berhasil
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Booking code strip --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:22px 32px 18px 32px;">
                            <p style="margin:0 0 4px 0; font-size:11.5px; color:#8a93a6; text-transform:uppercase; letter-spacing:0.6px;">Kode Booking</p>
                            <p style="margin:0; font-size:26px; font-weight:800; letter-spacing:2px; color:#E23744; font-family:'Courier New', monospace;">
                                {{ $booking->bk_code }}
                            </p>
                        </td>
                    </tr>

                    {{-- Ticket stub with perforated edge --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:0 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fc; border-radius:12px; border:1px solid #e6eaf2;">
                                <tr>
                                    <td style="padding:20px 20px 16px 20px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="42%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:11px; color:#8a93a6;">Asal</p>
                                                    <p style="margin:0; font-size:16px; font-weight:800; color:#0F2A66;">
                                                        {{ $booking->availability?->route?->originStation?->stn_name ?? '-' }}
                                                    </p>
                                                </td>
                                                <td width="16%" align="center" style="vertical-align:middle; color:#c7cede; font-size:18px;">&#8594;</td>
                                                <td width="42%" style="vertical-align:top; text-align:right;">
                                                    <p style="margin:0 0 3px 0; font-size:11px; color:#8a93a6;">Tujuan</p>
                                                    <p style="margin:0; font-size:16px; font-weight:800; color:#0F2A66;">
                                                        {{ $booking->availability?->route?->destinationStation?->stn_name ?? '-' }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                {{-- Dashed divider mimicking a ticket tear line --}}
                                <tr>
                                    <td style="padding:0 20px;">
                                        <div style="border-top:1.5px dashed #d3d9e6; height:1px; line-height:1px; font-size:0;">&nbsp;</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:16px 20px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="33%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:10.5px; color:#8a93a6; text-transform:uppercase;">Tanggal</p>
                                                    <p style="margin:0; font-size:13.5px; font-weight:700; color:#0F2A66;">
                                                        {{ optional($booking->availability?->av_date)->translatedFormat('d M Y') ?? '-' }}
                                                    </p>
                                                </td>
                                                <td width="33%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:10.5px; color:#8a93a6; text-transform:uppercase;">Jam Berangkat</p>
                                                    <p style="margin:0; font-size:13.5px; font-weight:700; color:#0F2A66;">
                                                        {{ $booking->availability?->av_time ?? '-' }}
                                                    </p>
                                                </td>
                                                <td width="34%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:10.5px; color:#8a93a6; text-transform:uppercase;">Armada</p>
                                                    <p style="margin:0; font-size:13.5px; font-weight:700; color:#0F2A66;">
                                                        {{ $booking->availability?->busType?->company?->co_name ?? '-' }}
                                                    </p>
                                                    <p style="margin:2px 0 0 0; font-size:11.5px; color:#6b7280;">
                                                        {{ $booking->availability?->busType?->bt_name ?? '-' }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Passenger table --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:22px 32px 4px 32px;">
                            <p style="margin:0 0 10px 0; font-size:13.5px; font-weight:800; color:#0F2A66;">Data Penumpang</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
                                <tr>
                                    <td style="padding:8px 10px; background-color:#0F2A66; color:#ffffff; font-size:11px; font-weight:700; border-radius:6px 0 0 0;">NAMA</td>
                                    <td style="padding:8px 10px; background-color:#0F2A66; color:#ffffff; font-size:11px; font-weight:700; text-align:center;">KURSI</td>
                                    <td style="padding:8px 10px; background-color:#0F2A66; color:#ffffff; font-size:11px; font-weight:700; text-align:center; border-radius:0 6px 0 0;">KATEGORI</td>
                                </tr>
                                @foreach ($booking->passengers as $index => $passenger)
                                    <tr style="background-color:{{ $index % 2 === 0 ? '#ffffff' : '#f7f9fc' }};">
                                        <td style="padding:10px; border-bottom:1px solid #edf0f5; font-weight:600;">{{ $passenger->ps_name }}</td>
                                        <td style="padding:10px; border-bottom:1px solid #edf0f5; text-align:center;">
                                            <span style="display:inline-block; background-color:#e8ecf5; color:#0F2A66; font-weight:700; font-size:12px; padding:2px 10px; border-radius:6px;">
                                                {{ $passenger->seat?->seat_number ?? '-' }}
                                            </span>
                                        </td>
                                        <td style="padding:10px; border-bottom:1px solid #edf0f5; text-align:center; text-transform:capitalize; color:#4b5563;">{{ $passenger->ps_category }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>

                    {{-- Payment summary --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:22px 32px 24px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f5; border:1px solid #fbdadd; border-radius:10px;">
                                <tr>
                                    <td style="padding:16px 18px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size:11.5px; color:#8a93a6;">Atas Nama</td>
                                                <td style="font-size:11.5px; color:#8a93a6; text-align:right;">Total Pembayaran</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size:15px; font-weight:800; color:#0F2A66; padding-top:2px;">{{ $booking->contact?->ct_name ?? '-' }}</td>
                                                <td style="font-size:18px; font-weight:800; color:#E23744; text-align:right; padding-top:2px;">
                                                    Rp {{ number_format($booking->bk_total_price, 0, ',', '.') }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Reminder --}}
                    <tr>
                        <td style="background-color:#f7f9fc; padding:16px 32px; border-top:1px solid #edf0f5;">
                            <p style="margin:0; font-size:12.5px; color:#4b5563; line-height:1.6;">
                                &#9432; Tunjukkan e-tiket ini (kode booking) saat check-in di loket keberangkatan, dan pastikan tiba minimal 30 menit sebelum jadwal keberangkatan.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer with support info --}}
                    <tr>
                        <td style="background-color:#0F2A66; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
                            <p style="margin:0 0 6px 0; font-size:12.5px; color:#ffffff; font-weight:700;">Butuh bantuan seputar tiket ini?</p>
                            <p style="margin:0; font-size:11.5px; color:#a9bce0;">
                                support@seebus.co.id &nbsp;&middot;&nbsp; +62 21 555 1234 &nbsp;&middot;&nbsp; WhatsApp +62 812 3456 7890
                            </p>
                            <p style="margin:12px 0 0 0; font-size:10.5px; color:#6d80ab;">
                                Terima kasih telah memesan bersama SeeBus. Email ini dikirim otomatis, mohon tidak membalas langsung ke alamat ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
