import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { clearPendingBooking } from '../../utils/pendingBooking'
export default function PembayaranBerhasil() {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')
  const bookingCode = params.get('booking_code')
  const isSuccess = status === 'success'
  useEffect(() => {
    if (status === 'success') {
      clearPendingBooking()
    }
  }, [status])
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-md mx-auto px-4 md:px-6 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-10">
          <div className={`w-14 h-14 rounded-full ${isSuccess ? 'bg-navy-900' : 'bg-red-600'} flex items-center justify-center mx-auto mb-4`}>
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-6">
            {isSuccess ? 'Pembayaran berhasil' : 'Pembayaran belum berhasil'}
          </h1>

          <div className="card flex items-center gap-3 text-sm text-navy-900 mb-4">
            <Mail className="w-5 h-5 text-brand-red shrink-0" />
            {isSuccess ? 'E-tiket akan dikirim ke email Anda.' : 'Silakan coba pembayaran kembali atau hubungi layanan kami.'}
          </div>

          {bookingCode && <p className="text-sm text-gray-600">Kode booking: <strong>{bookingCode}</strong></p>}

          <Link
            to="/"
            className="inline-block border border-navy-900 text-navy-900 rounded-xl px-6 py-3 mt-6 text-sm font-medium hover:bg-navy-900/5 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
