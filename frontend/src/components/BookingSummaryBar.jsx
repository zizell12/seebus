import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Users } from 'lucide-react'
import { useBooking, totalPenumpang } from '../context/BookingContext'
export default function BookingSummaryBar() {
  const navigate = useNavigate()
  const { booking } = useBooking()
  const { dari, tujuan, tanggal, penumpang } = booking.search
  return (
    <div className="bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          {dari} <ArrowRight className="w-4 h-4 text-white/50" /> {tujuan}
        </div>
        <div className="flex items-center gap-4 text-white/80 text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {tanggal &&
              new Date(tanggal).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {totalPenumpang(penumpang)} Penumpang
          </span>
          <button
            onClick={() => navigate('/pencarian')}
            className="bg-brand-red text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            Ubah
          </button>
        </div>
      </div>
    </div>
  )
}
