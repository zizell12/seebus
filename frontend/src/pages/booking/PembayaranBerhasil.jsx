import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import { clearPendingBooking } from '../../utils/pendingBooking'

// Penanda "kode booking ini sudah terverifikasi lunas".
//
// Kenapa perlu: setelah verifikasi pertama sukses, resetBooking() menghapus data
// booking (termasuk email) dari memori browser. Kalau halaman ini di-refresh,
// email sudah tidak ada sehingga verifikasi tidak bisa diulang dan halaman salah
// menampilkan "Pembayaran belum berhasil" padahal booking sudah lunas di server.
//
// Yang disimpan HANYA kode booking (bukan email atau data pribadi lain). Penanda ini
// hanya untuk tampilan, bukan bukti pembayaran: status sebenarnya tetap dari server.
const VERIFIED_KEY = 'seebus_paid_verified'
const MAX_VERIFIED = 10

function readVerified() {
  try {
    const raw = sessionStorage.getItem(VERIFIED_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function isVerified(code) {
  return !!code && readVerified().includes(code)
}

function readTicketDetails(code) {
  try {
    const raw = sessionStorage.getItem(`${VERIFIED_KEY}_seats`)
    const details = raw ? JSON.parse(raw) : []
    return details.find((item) => item.code === code) || null
  } catch {
    return null
  }
}

function saveVerified(code) {
  if (!code) return
  try {
    const list = readVerified().filter((c) => c !== code)
    list.push(code)
    sessionStorage.setItem(VERIFIED_KEY, JSON.stringify(list.slice(-MAX_VERIFIED)))
  } catch {
    // sessionStorage bisa saja diblokir (mode privat tertentu); abaikan.
  }
}

function saveTicketDetails(code, data) {
  if (!code) return
  try {
    const key = `${VERIFIED_KEY}_seats`
    const raw = sessionStorage.getItem(key)
    const items = raw ? JSON.parse(raw) : []
    const next = items.filter((item) => item.code !== code)
    next.push({
      code,
      numbered: Boolean(data.jadwal?.pakai_nomor_kursi),
      passengers: (data.passengers || []).map((passenger) => ({
        ps_category: passenger.ps_category,
        ps_seat_number: passenger.ps_seat_number,
      })),
    })
    sessionStorage.setItem(key, JSON.stringify(next.slice(-MAX_VERIFIED)))
  } catch {
    // Keep the verified-payment flow working when browser storage is unavailable.
  }
}

export default function PembayaranBerhasil() {
  const { booking, resetBooking } = useBooking()
  const { t } = useLanguage()
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')
  const bookingCode = params.get('booking_code')
  const [paymentVerified, setPaymentVerified] = useState(() => status === 'success' && isVerified(bookingCode))
  const [ticketDetails, setTicketDetails] = useState(() => readTicketDetails(bookingCode))
  const [verificationError, setVerificationError] = useState(false)
  const isSuccess = status === 'success' && paymentVerified

  useEffect(() => {
    if (status !== 'success') return
    // Sudah terverifikasi (mis. halaman di-refresh): tidak perlu bertanya ke server lagi.
    if (paymentVerified) return
    if (!bookingCode || !booking.contact.email) {
      setVerificationError(true)
      return
    }
    let active = true
    api.lookupBooking({ bk_code: bookingCode, email: booking.contact.email })
      .then((data) => {
        if (!active) return
        if (data.bk_status === 'paid') {
          saveTicketDetails(bookingCode, data)
          setTicketDetails({
            numbered: Boolean(data.jadwal?.pakai_nomor_kursi),
            passengers: data.passengers || [],
          })
          saveVerified(bookingCode)
          setPaymentVerified(true)
          clearPendingBooking()
          resetBooking()
        } else {
          setVerificationError(true)
        }
      })
      .catch(() => active && setVerificationError(true))
    return () => { active = false }
  }, [status, bookingCode, booking.contact.email, paymentVerified])

  // Tiga keadaan yang berbeda, supaya pembeli tidak salah mengira pembayarannya gagal:
  //  - success terverifikasi   : "Pembayaran berhasil"
  //  - success tapi tak bisa dicek (email hilang, jaringan, dsb.): "belum dapat dikonfirmasi"
  //  - status lain (batal/gagal dari PayPal): "Pembayaran belum berhasil"
  const checking = status === 'success' && !paymentVerified && !verificationError
  const unconfirmed = status === 'success' && !paymentVerified && verificationError

  let heading = 'Pembayaran belum berhasil'
  if (isSuccess) heading = 'Pembayaran berhasil'
  else if (checking) heading = 'Memeriksa pembayaran...'
  else if (unconfirmed) heading = 'Status pembayaran belum dapat dikonfirmasi'

  let message = 'Silakan coba pembayaran kembali atau hubungi layanan kami.'
  if (isSuccess) {
    message = 'Pembayaran terkonfirmasi. E-tiket akan dikirim ke email Anda. Jika belum terlihat, periksa juga folder Spam.'
  } else if (unconfirmed) {
    message = 'Kami belum dapat memastikan status pembayaran di perangkat ini. Jika Anda sudah membayar, e-tiket dikirim ke email Anda (periksa juga folder Spam). Anda juga bisa mengecek lewat halaman Lanjutkan Pembayaran atau menghubungi layanan kami.'
  }

  const circleColor = isSuccess ? 'bg-navy-900' : unconfirmed || checking ? 'bg-amber-500' : 'bg-red-600'

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-md mx-auto px-4 md:px-6 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-10">
          <div className={`w-14 h-14 rounded-full ${circleColor} flex items-center justify-center mx-auto mb-4`}>
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-6">{heading}</h1>

          <div className="card flex items-center gap-3 text-sm text-navy-900 mb-4 text-left">
            <Mail className="w-5 h-5 text-brand-red shrink-0" />
            {message}
          </div>

          {bookingCode && <p className="text-sm text-gray-600">Kode booking: <strong>{bookingCode}</strong></p>}

          {isSuccess && ticketDetails?.passengers?.length > 0 && (
            <section className="mt-5 text-left">
              <h2 className="font-bold text-navy-900 mb-2">{t.seatLabels.passengerSeats}</h2>
              <div className="space-y-2">
                {ticketDetails.passengers.map((passenger, index) => (
                  <div key={index} className="flex justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span>{t.penumpangPage.penumpangKe} {index + 1}</span>
                    <span className="font-semibold text-navy-900">
                      {passenger.ps_category === 'infant'
                        ? t.seatLabels.infantNoSeat
                        : passenger.ps_seat_number
                        ? `${t.seatLabels.seat} ${passenger.ps_seat_number.toUpperCase()}`
                        : ticketDetails.numbered ? t.seatLabels.unassigned : t.seatLabels.free}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {unconfirmed && (
            <Link
              to="/pemesanan/lanjutkan"
              className="inline-block bg-brand-red text-white rounded-xl px-6 py-3 mt-6 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Cek status booking
            </Link>
          )}

          <Link
            to="/"
            className="inline-block border border-navy-900 text-navy-900 rounded-xl px-6 py-3 mt-3 text-sm font-medium hover:bg-navy-900/5 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}