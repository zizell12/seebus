import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
export default function PembayaranBerhasil() {
  const navigate = useNavigate()
  const { booking, resetBooking } = useBooking()
  const { selectedBus, search } = booking
  useEffect(() => {
    if (!selectedBus) navigate('/')
  }, [selectedBus, navigate])
  if (!selectedBus) return null
  return (
    <div className="max-w-md mx-auto px-4 md:px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-navy-900 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-xl font-bold text-navy-900 mb-6">Pembayaran berhasil</h1>

      <div className="card flex items-center gap-3 text-sm text-navy-900 mb-4">
        <Mail className="w-5 h-5 text-brand-red shrink-0" />
        Tiket dikirim ke email
      </div>

      <div className="card">
        <p className="text-xs text-gray-400 mb-3">PEMESANAN</p>
        <div className="bg-navy-900 rounded-lg px-4 py-3 flex items-center justify-between text-white text-sm">
          <span className="font-medium">{search.dari}</span>
          <span className="text-white/50">→</span>
          <span className="font-medium">{search.tujuan}</span>
        </div>
      </div>

      <Link
        to="/"
        onClick={resetBooking}
        className="inline-block border border-navy-900 text-navy-900 rounded-xl px-6 py-3 mt-6 text-sm font-medium hover:bg-navy-900/5 transition-colors"
      >
        Kembali Ke Halaman Utama
      </Link>
    </div>
  )
}
