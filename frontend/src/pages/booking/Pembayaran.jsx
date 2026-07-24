import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { MapPin } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import { useBooking } from '../../context/BookingContext'
import { api } from '../../utils/api'
import backgrounddb from '../../assets/background-db.png'
export default function Pembayaran() {
  const navigate = useNavigate()
  const { booking, setPayment } = useBooking()
  const { selectedBus, selectedSeats, passengers, search, contact, notes, booking_id } = booking
  const totalHarga = selectedBus ? selectedBus.harga * passengers.length : 0
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <p className="text-xs text-gray-400">Beranda &gt; Pembayaran</p>
      </div>

      <BookingSummaryBar />

      <div className="max-w-md mx-auto px-4 md:px-6 pb-14">
        <div className="card">
          <h2 className="font-bold text-navy-900 mb-4">Rincian Pemesanan</h2>

          <div className="flex items-start gap-2 text-sm text-navy-900 mb-3">
            <MapPin className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                {search.dari} → {search.tujuan}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(search.tanggal).toLocaleDateString('id-ID', {
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
              Kursi {selectedSeats.nomor.join(', ')} ({selectedBus.kelas})
            </p>
            <p className="text-xs text-gray-400">{passengers.length} Penumpang</p>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Harga</span>
            <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-navy-900 mb-6">
            <span>Total</span>
            <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>

          <PayPalScriptProvider
            options={{
              'client-id': 'sb',
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
