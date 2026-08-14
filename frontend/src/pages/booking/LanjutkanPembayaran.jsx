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
        setInfo(
          id
            ? 'Booking ini sudah dibayar. Tidak perlu membayar lagi.'
            : 'This booking has already been paid. No need to pay again.'
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

      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
        clearPendingBooking()
        setError(
          id
            ? 'Batas waktu penguncian kursi untuk booking ini sudah lewat dan akan segera ditandai kedaluwarsa. Silakan pesan ulang.'
            : 'The seat hold for this booking has expired and will soon be marked expired. Please book again.'
        )
        return
      }

      hydrateFromLookup(data)
      if (data.expires_at) {
        savePendingBooking({ code: data.bk_code, expiresAt: data.expires_at })
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
