<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selesaikan Pembayaran SeeBus</title>
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
                                        <div style="color:#a9bce0; font-size:12.5px; margin-top:2px;">Booking Anda menunggu pembayaran</div>
                                    </td>
                                    <td align="right">
                                        <span style="display:inline-block; background-color:rgba(226,55,68,0.18); color:#ffb3b8; font-size:11px; font-weight:700; letter-spacing:0.5px; padding:6px 12px; border-radius:999px; text-transform:uppercase;">
                                            Menunggu Pembayaran
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Booking code strip --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:22px 32px 8px 32px;">
                            <p style="margin:0 0 4px 0; font-size:11.5px; color:#8a93a6; text-transform:uppercase; letter-spacing:0.6px;">Kode Booking Anda</p>
                            <p style="margin:0; font-size:26px; font-weight:800; letter-spacing:2px; color:#E23744; font-family:'Courier New', monospace;">
                                {{ $booking->bk_code }}
                            </p>
                            <p style="margin:8px 0 0 0; font-size:12.5px; color:#4b5563; line-height:1.6;">
                                Simpan email ini. Kalau Anda belum sempat membayar sekarang, gunakan kode di atas
                                bersama email ini (<strong>{{ $booking->contact?->ct_email }}</strong>) untuk
                                melanjutkan pembayaran kapan saja lewat tombol di bawah.
                            </p>
                        </td>
                    </tr>

                    {{-- Trip summary --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:14px 32px 4px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fc; border-radius:12px; border:1px solid #e6eaf2;">
                                <tr>
                                    <td style="padding:18px 20px;">
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
                                <tr>
                                    <td style="padding:0 20px;">
                                        <div style="border-top:1.5px dashed #d3d9e6; height:1px; line-height:1px; font-size:0;">&nbsp;</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:10.5px; color:#8a93a6; text-transform:uppercase;">Tanggal</p>
                                                    <p style="margin:0; font-size:13.5px; font-weight:700; color:#0F2A66;">
                                                        {{ optional($booking->availability?->av_date)->translatedFormat('d M Y') ?? '-' }}
                                                    </p>
                                                </td>
                                                <td width="50%" style="vertical-align:top;">
                                                    <p style="margin:0 0 3px 0; font-size:10.5px; color:#8a93a6; text-transform:uppercase;">Jam Berangkat</p>
                                                    <p style="margin:0; font-size:13.5px; font-weight:700; color:#0F2A66;">
                                                        {{ substr((string) $booking->availability?->av_time, 0, 5) ?: '-' }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Total & CTA --}}
                    <tr>
                        <td style="background-color:#ffffff; padding:22px 32px 8px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f5; border:1px solid #fbdadd; border-radius:10px;">
                                <tr>
                                    <td style="padding:16px 18px;">
                                        <p style="margin:0 0 2px 0; font-size:11.5px; color:#8a93a6;">Total yang harus dibayar</p>
                                        <p style="margin:0; font-size:22px; font-weight:800; color:#E23744;">
                                            Rp {{ number_format($booking->bk_total_price, 0, ',', '.') }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color:#ffffff; padding:20px 32px 28px 32px;">
                            <a href="{{ $lanjutkanUrl }}"
                               style="display:inline-block; background-color:#E23744; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px 28px; border-radius:10px;">
                                Lanjutkan Pembayaran
                            </a>
                            <p style="margin:14px 0 0 0; font-size:11px; color:#8a93a6;">
                                Kursi Anda ditahan sementara. Jika pembayaran tidak diselesaikan dalam waktu
                                sekitar 15 menit sejak booking dibuat, kursi dapat dilepas kembali dan booking
                                ditandai kedaluwarsa.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer with support info --}}
                    <tr>
                        <td style="background-color:#0F2A66; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
                            <p style="margin:0 0 6px 0; font-size:12.5px; color:#ffffff; font-weight:700;">Butuh bantuan seputar booking ini?</p>
                            <p style="margin:0; font-size:11.5px; color:#a9bce0;">
                                support@seebus.co.id &nbsp;&middot;&nbsp; +62 21 555 1234 &nbsp;&middot;&nbsp; WhatsApp +62 812 3456 7890
                            </p>
                            <p style="margin:12px 0 0 0; font-size:10.5px; color:#6d80ab;">
                                Email ini dikirim otomatis karena ada booking baru dibuat dengan alamat email ini.
                                Mohon tidak membalas langsung ke alamat ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
