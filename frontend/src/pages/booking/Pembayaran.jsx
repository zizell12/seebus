import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import { useBooking } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import { clearPendingBooking } from '../../utils/pendingBooking'
import backgrounddb from '../../assets/background-db.png'
export default function Pembayaran() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { booking, setPendingBooking, setBookingId, setBookingCode } = useBooking()
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const { selectedBus, selectedStops, passengers, search, contact, notes, booking_id, booking_code, harga } = booking
  const expiresAt = booking.pendingBooking?.expiresAt || null
  const [now, setNow] = useState(Date.now())
  const [holdLookupLoading, setHoldLookupLoading] = useState(!expiresAt)
  const [holdExpired, setHoldExpired] = useState(false)
  const [holdLookupError, setHoldLookupError] = useState('')
  const totalHarga = harga?.total ?? 0
  const hargaPublish = harga?.publish ?? 0
  const biayaLayanan = harga?.biayaLayanan ?? 0

  useEffect(() => {
    setHoldExpired(false)
    setHoldLookupError('')
    if (expiresAt) {
      setHoldLookupLoading(false)
      return undefined
    }
    if (!booking_code || !contact.email) {
      setHoldLookupLoading(false)
      setHoldLookupError(lang === 'en' ? 'Unable to verify the payment hold.' : 'Batas waktu booking tidak dapat diverifikasi.')
      return undefined
    }

    let active = true
    setHoldLookupLoading(true)
    api.lookupBooking({ bk_code: booking_code, email: contact.email })
      .then((data) => {
        if (!active) return
        if (data.bk_status !== 'pending' || !data.berlaku_sampai) {
          setHoldExpired(true)
          return
        }
        setPendingBooking({
          bk_code: data.bk_code,
          email: contact.email,
          expiresAt: data.berlaku_sampai,
        })
      })
      .catch((error) => {
        if (active) setHoldLookupError(error.message || (lang === 'en' ? 'Unable to verify the payment hold.' : 'Batas waktu booking tidak dapat diverifikasi.'))
      })
      .finally(() => active && setHoldLookupLoading(false))

    return () => { active = false }
  }, [booking_code, contact.email, expiresAt, lang])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const expiryTimestamp = expiresAt ? new Date(expiresAt).getTime() : Number.NaN
  const validExpiry = Number.isFinite(expiryTimestamp)
  const secondsLeft = validExpiry
    ? Math.max(0, Math.floor((expiryTimestamp - now) / 1000))
    : 0
  const isHoldExpired = holdExpired || (validExpiry && secondsLeft <= 0) || (Boolean(expiresAt) && !validExpiry)
  const holdUsable = validExpiry && !isHoldExpired && !holdLookupLoading
  const remainingTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const releaseAndEdit = async () => {
    const pending = booking.pendingBooking || { bk_code: booking_code, email: contact.email }
    if (pending?.bk_code && pending.email) {
      try {
        await api.releasePendingBooking({ bk_code: pending.bk_code, email: pending.email })
        clearPendingBooking()
        setPendingBooking(null)
        setBookingId(null)
        setBookingCode(null)
      } catch (error) {
        console.warn('Booking pending tidak dapat dilepas saat kembali mengubah data.', error)
      }
    }
    navigate('/pemesanan/penumpang')
  }

  if (!selectedBus || !passengers.length || !booking_id) {
    navigate('/pencarian')
    return null
  }
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgrounddb})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 text-center">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-6">SeeBus - Pesan Mudah, Perjalanan Nyaman</h1>
          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      <BookingSummaryBar showUbah={false} />

      <div className="max-w-md mx-auto px-4 md:px-6 pt-8 pb-14">
        <div className="card">
          <h2 className="font-bold text-navy-900 mb-4">{t.pembayaranPage.rincianPemesanan}</h2>

          {booking_code && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-navy-900">
              <p>
                {lang === 'en' ? 'Booking code' : 'Kode booking'}:{' '}
                <span className="font-mono font-bold tracking-wider">{booking_code}</span>
              </p>
              <p className="mt-1 text-gray-500">
                {lang === 'en'
                  ? "We've also emailed this code with a link to continue payment later, in case you leave this page."
                  : 'Kode ini juga sudah kami kirim ke email Anda beserta tautan untuk melanjutkan pembayaran nanti, jaga-jaga kalau Anda meninggalkan halaman ini.'}
              </p>
            </div>
          )}

          {holdLookupLoading ? (
            <p role="status" className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {t.pembayaranPage.checkingHold}
            </p>
          ) : isHoldExpired ? (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
              {t.pembayaranPage.holdExpired}
            </div>
          ) : holdLookupError ? (
            <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {holdLookupError}
            </p>
          ) : (
            <p role="timer" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              {t.pembayaranPage.completeWithin} {remainingTime}
            </p>
          )}

          <div className="flex items-start gap-2 text-sm text-navy-900 mb-3">
            <MapPin className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                {search.dari} → {search.tujuan}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(search.tanggal).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                , {selectedBus.jamBerangkat} - {selectedBus.jamTiba}
              </p>
            </div>
          </div>

          <div className="text-sm text-navy-900 mb-4 pb-4 border-b border-gray-100">
            <p className="font-medium">
              {selectedStops?.fromName} → {selectedStops?.toName} ({selectedBus.kelas})
            </p>
            <p className="text-xs text-gray-400">{passengers.length} {t.pembayaranPage.penumpang}</p>
            <div className="mt-3 space-y-1.5">
              {passengers.map((passenger, index) => (
                <div key={`${passenger.ps_name || passenger.nama}-${index}`} className="flex justify-between gap-3 text-xs text-gray-600">
                  <span>{passenger.ps_name || passenger.nama}</span>
                  <span className="font-semibold text-navy-900">
                    {passenger.ps_category === 'infant' || passenger.kategori === 'infant'
                      ? t.seatLabels.infantNoSeat
                      : passenger.ps_seat_number
                      ? `${t.seatLabels.seat} ${passenger.ps_seat_number.toUpperCase()}`
                      : selectedBus.pakaiNomorKursi
                        ? t.seatLabels.unassigned
                        : t.seatLabels.free}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.pembayaranPage.harga}</span>
            <span>Rp {hargaPublish.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.pembayaranPage.biayaLayanan}</span>
            <span>Rp {biayaLayanan.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-navy-900 mb-6 pt-2 border-t border-gray-100">
            <span>{t.pembayaranPage.total}</span>
            <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>

          <button
            type="button"
            className="w-full bg-[#0070ba] text-white rounded-lg px-4 py-3 font-semibold hover:bg-[#005ea6] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={paymentLoading || !holdUsable}
            onClick={async () => {
              if (paymentLoading) return
              setPaymentLoading(true)
              setPaymentError('')
              try {
                const response = await api.createPaypalOrder({ bk_code: booking_code, email: contact.email })
                window.location.assign(response.data.redirect_url)
              } catch (error) {
                setPaymentError(error.message || 'Tidak dapat memulai pembayaran PayPal.')
                setPaymentLoading(false)
              }
            }}
          >
            {paymentLoading ? 'Menghubungkan ke PayPal...' : 'Bayar dengan PayPal'}
          </button>
          {paymentError && <p role="alert" className="mt-3 text-sm text-red-700">{paymentError}</p>}
          <button
            type="button"
            onClick={releaseAndEdit}
            className="mt-3 w-full rounded-lg border border-navy-900 px-4 py-2.5 text-sm font-semibold text-navy-900"
          >
            {t.pembayaranPage.editAndChooseSeats}
          </button>
        </div>
      </div>
    </div>
  )
}
