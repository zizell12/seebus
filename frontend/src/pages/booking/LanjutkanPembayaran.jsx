import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertCircle } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import { savePendingBooking, clearPendingBooking } from '../../utils/pendingBooking'
import backgrounddb from '../../assets/background-db.png'

// Halaman ini dibuat karena sebelumnya TIDAK ADA tempat sama sekali untuk
// melanjutkan booking yang pembayarannya masih pending: data booking cuma
// disimpan di BookingContext (state React di memori), jadi begitu tab
// direfresh atau ditutup, satu-satunya jalan yang tersisa adalah kembali ke
// /pencarian dan memesan ulang dari nol - padahal booking & kursi lama masih
// berstatus pending selama belum lewat 15 menit.
export default function LanjutkanPembayaran() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { hydrateFromLookup } = useBooking()
  const [bkCode, setBkCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [paidPassengers, setPaidPassengers] = useState(null)
  const [seatNumbered, setSeatNumbered] = useState(false)

  const id = lang !== 'en'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const data = await api.lookupBooking({ bk_code: bkCode.trim(), email: email.trim() })

      if (data.bk_status === 'paid') {
        clearPendingBooking()
        setPaidPassengers(data.passengers || [])
        setSeatNumbered(Boolean(data.jadwal?.pakai_nomor_kursi))
        setInfo(
          id
            ? 'Booking ini sudah dibayar. Tidak perlu membayar lagi.'
            : 'This booking has already been paid. No need to pay again.'
        )
        return
      }

      if (data.bk_status === 'cancelled') {
        clearPendingBooking()
        const pembatalan = data.pembatalan
        if (pembatalan?.sudah_dibayar === false) {
          setError(
            id
              ? 'Booking ini telah dibatalkan. Anda belum melakukan pembayaran, jadi tidak ada dana yang perlu dikembalikan.'
              : 'This booking has been cancelled. You have not made a payment, so there are no funds to refund.'
          )
          return
        }

        if (pembatalan?.refund_jumlah > 0) {
          const jumlahRefund = new Intl.NumberFormat('id-ID').format(pembatalan.refund_jumlah)
          const refundUsd =
            pembatalan.refund_usd !== null && pembatalan.refund_usd > 0
              ? ` ($${Number(pembatalan.refund_usd).toFixed(2)} USD)`
              : ''
          setError(
            id
              ? `Booking ini telah dibatalkan. Refund ${pembatalan.refund_persen}% sebesar Rp ${jumlahRefund}${refundUsd} telah diproses ke PayPal Anda. Lama dana masuk bergantung pada PayPal dan bank Anda.`
              : `This booking has been cancelled. A ${pembatalan.refund_persen}% refund of Rp ${jumlahRefund}${refundUsd} has been processed to your PayPal account. The time for funds to arrive depends on PayPal and your bank.`
          )
          return
        }

        setError(
          id
            ? 'Booking ini telah dibatalkan. Sesuai kebijakan pembatalan, booking ini tidak mendapat pengembalian dana.'
            : 'This booking has been cancelled. Under the cancellation policy, this booking is not eligible for a refund.'
        )
        return
      }

      if (data.bk_status !== 'pending') {
        clearPendingBooking()
        setError(
          id
            ? 'Booking ini sudah kedaluwarsa atau dibatalkan. Kursi sudah dilepas, silakan pesan ulang.'
            : 'This booking has expired or been cancelled. The seats have been released, please book again.'
        )
        return
      }

      if (data.berlaku_sampai && new Date(data.berlaku_sampai).getTime() < Date.now()) {
        clearPendingBooking()
        setError(
          id
            ? 'Batas waktu penguncian kursi untuk booking ini sudah lewat dan akan segera ditandai kedaluwarsa. Silakan pesan ulang.'
            : 'The seat hold for this booking has expired and will soon be marked expired. Please book again.'
        )
        return
      }

      hydrateFromLookup(data)
      if (data.berlaku_sampai) {
        savePendingBooking({ code: data.bk_code, expiresAt: data.berlaku_sampai })
      }
      navigate('/pemesanan/pembayaran')
    } catch (err) {
      setError(err.message || (id ? 'Booking tidak ditemukan.' : 'Booking not found.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgrounddb})`,
        }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-14 text-center">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-2">
            {id ? 'Lanjutkan Pembayaran' : 'Continue Payment'}
          </h1>
          <p className="text-white/80 text-sm">
            {id
              ? 'Sudah memesan tapi belum sempat membayar? Masukkan kode booking dan email yang Anda gunakan saat memesan.'
              : "Already booked but haven't paid yet? Enter the booking code and email you used when booking."}
          </p>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 md:px-6 py-12">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              {id ? 'Kode Booking' : 'Booking Code'}
            </label>
            <input
              type="text"
              required
              value={bkCode}
              onChange={(e) => setBkCode(e.target.value)}
              placeholder="SB-XXXXXXXX"
              className="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2 text-sm text-navy-900 bg-blue-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}
          {paidPassengers && (
            <section className="rounded-lg border border-gray-100 p-3">
              <h2 className="mb-2 text-sm font-bold text-navy-900">{t.seatLabels.passengerSeats}</h2>
              <div className="space-y-2">
                {paidPassengers.map((passenger, index) => (
                  <div key={index} className="flex justify-between gap-3 text-sm">
                    <span>{passenger.ps_name}</span>
                    <span className="font-semibold text-navy-900">
                      {passenger.ps_category === 'infant'
                        ? t.seatLabels.infantNoSeat
                        : passenger.ps_seat_number
                        ? `${t.seatLabels.seat} ${passenger.ps_seat_number.toUpperCase()}`
                        : seatNumbered ? t.seatLabels.unassigned : t.seatLabels.free}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {loading ? (id ? 'Mencari...' : 'Searching...') : id ? 'Cari Booking' : 'Find Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
