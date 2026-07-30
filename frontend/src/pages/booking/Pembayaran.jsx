import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
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
  const { booking, setPayment } = useBooking()
  const { selectedBus, selectedSeats, passengers, search, contact, notes, booking_id, harga } = booking
  const totalHarga = harga?.total ?? 0
  const hargaPublish = harga?.publish ?? 0
  const biayaLayanan = harga?.biayaLayanan ?? 0
  const totalUsd = (totalHarga / 15000).toFixed(2)
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

          <PayPalScriptProvider
            options={{
                'client-id': 'AXda5MhdP4vFOYtmRpevlQiJXwSb-sHYX8wuUKCwMMw7-5qENUr5T1Cd9jdY8YBhwG45E5AwEXepLAnS', // sama seperti PAYPAL_CLIENT_ID di backend
                currency: 'USD',
              }}
          >
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'blue',
                label: 'paypal',
              }}
              createOrder={async () => {
                const response = await api.createPaypalOrder({ booking_id })
                return response.data.id || response.data.orderID || response.data?.id
              }}
              onApprove={async (data) => {
                try {
                  await api.capturePaypalOrder({ booking_id, orderID: data.orderID })
                  setPayment({
                    metode: 'paypal',
                    status: 'success',
                  })
                  navigate('/pemesanan/berhasil')
                } catch (error) {
                  console.error(error)
                  setPayment({
                    metode: 'paypal',
                    status: 'failed',
                  })
                }
              }}
              onError={() => {
                setPayment({
                  metode: 'paypal',
                  status: 'failed',
                })
              }}
            />
          </PayPalScriptProvider>
        </div>
      </div>
    </div>
  )
}
