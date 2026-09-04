import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import { useBooking } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import backgrounddb from '../../assets/background-db.png'
export default function Pembayaran() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { booking } = useBooking()
  const { selectedBus, selectedSeats, passengers, search, contact, notes, booking_id, booking_code, harga } = booking
  const totalHarga = harga?.total ?? 0
  const hargaPublish = harga?.publish ?? 0
  const biayaLayanan = harga?.biayaLayanan ?? 0
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
              {t.penumpangPage.kursiLabel} {selectedSeats.nomor.join(', ')} ({selectedBus.kelas})
            </p>
            <p className="text-xs text-gray-400">{passengers.length} {t.pembayaranPage.penumpang}</p>
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
            className="w-full bg-[#0070ba] text-white rounded-lg px-4 py-3 font-semibold hover:bg-[#005ea6]"
            onClick={async () => {
              const response = await api.createPaypalOrder({ booking_id })
              window.location.assign(response.data.redirect_url)
            }}
          >
            Bayar dengan PayPal
          </button>
        </div>
      </div>
    </div>
  )
}
