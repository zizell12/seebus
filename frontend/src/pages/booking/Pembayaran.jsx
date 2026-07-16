import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'

export default function Pembayaran() {
  const { booking, setPayment } = useBooking()
  const navigate = useNavigate()
  const [showPaypal, setShowPaypal] = useState(false)
  const [processing, setProcessing] = useState(false)

  const bus = booking.selectedBus
  const nomorKursi = booking.selectedSeats?.nomor || []

  if (!bus || booking.passengers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Data pemesanan belum lengkap.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Ke Beranda</button>
      </div>
    )
  }

  const total = bus.harga * booking.passengers.length

  // Simulasi konfirmasi pembayaran PayPal.
  // Implementasi asli: gunakan PayPal JS SDK (paypal.Buttons) yang membuka
  // popup resmi PayPal, lalu kirim order id ke backend Laravel (POST /api/booking
  // untuk buat booking, lalu POST /api/pembayaran/paypal/capture untuk verifikasi).
  const konfirmasiPaypal = () => {
    setProcessing(true)
    setTimeout(() => {
      setPayment({ metode: 'PayPal', status: 'success' })
      setProcessing(false)
      setShowPaypal(false)
      navigate('/pemesanan/berhasil')
    }, 1500)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-xl md:text-2xl font-bold text-navy-900 mb-6">Pembayaran</h1>

      <div className="card mb-6">
        <h3 className="font-bold text-navy-900 mb-3">Ringkasan Pesanan</h3>
        <div className="text-sm text-gray-500 space-y-1.5">
          <div className="flex justify-between"><span>Rute</span><span className="text-navy-900 font-medium">{bus.dari} → {bus.tujuan}</span></div>
          <div className="flex justify-between"><span>Bus</span><span className="text-navy-900 font-medium">{bus.operator} · {bus.kategori}</span></div>
          <div className="flex justify-between"><span>Kursi</span><span className="text-navy-900 font-medium">{nomorKursi.join(', ')}</span></div>
          <div className="flex justify-between"><span>Jumlah Penumpang</span><span className="text-navy-900 font-medium">{booking.passengers.length}</span></div>
          <div className="border-t my-2" />
          <div className="flex justify-between text-base">
            <span className="font-bold text-navy-900">Total Bayar</span>
            <span className="font-extrabold text-brand-red">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-navy-900 mb-3">Metode Pembayaran</h3>
        <button
          onClick={() => setShowPaypal(true)}
          className="w-full border-2 border-[#003087] rounded-lg py-3 font-bold text-[#003087] flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
        >
          Bayar dengan PayPal
        </button>
      </div>

      {showPaypal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowPaypal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Tutup"
            >
              ✕
            </button>
            <div className="text-center mb-5">
              <p className="text-[#003087] font-extrabold text-2xl italic">PayPal</p>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">
              Konfirmasi pembayaran sebesar <span className="font-bold text-navy-900">Rp {total.toLocaleString('id-ID')}</span>
            </p>
            <button
              onClick={konfirmasiPaypal}
              disabled={processing}
              className="w-full bg-[#0070ba] text-white font-bold py-2.5 rounded-full hover:bg-[#005ea6] transition-colors disabled:opacity-60"
            >
              {processing ? 'Memproses...' : 'Konfirmasi & Bayar'}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              *Ini adalah simulasi. Booking belum tersimpan ke database — perlu endpoint
              POST /api/booking dulu untuk itu.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
