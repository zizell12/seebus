import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'

export default function PembayaranBerhasil() {
  const { booking, resetBooking } = useBooking()
  const navigate = useNavigate()
  const bus = booking.selectedBus
  const nomorKursi = booking.selectedSeats?.nomor || []

  if (!bus) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Tidak ada data pesanan.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Ke Beranda</button>
      </div>
    )
  }

  const kodeBooking = `SB-${Date.now().toString().slice(-8)}`

  const selesai = () => {
    resetBooking()
    navigate('/dashboard')
  }

  return (
    <div className="max-w-lg mx-auto px-4 md:px-6 py-16 text-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Pembayaran Berhasil!</h1>
      <p className="text-gray-500 mb-8">Tiket kamu sudah dikonfirmasi. E-tiket dapat dilihat di dashboard akun.</p>

      <div className="card text-left">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Kode Booking</span>
          <span className="font-bold text-navy-900">{kodeBooking}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Rute</span>
          <span className="font-bold text-navy-900">{bus.dari} → {bus.tujuan}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Bus</span>
          <span className="font-bold text-navy-900">{bus.operator} · {bus.kategori}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Kursi</span>
          <span className="font-bold text-navy-900">{nomorKursi.join(', ')}</span>
        </div>
      </div>

      <button onClick={selesai} className="btn-primary w-full mt-6">Lihat di Dashboard</button>
      <Link to="/" onClick={resetBooking} className="block text-sm text-gray-500 mt-4 hover:underline">
        Kembali ke Beranda
      </Link>
    </div>
  )
}
