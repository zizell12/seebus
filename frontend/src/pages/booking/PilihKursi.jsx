import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking, kursiDibutuhkan } from '../../context/BookingContext'
import { api } from '../../utils/api'

export default function PilihKursi() {
  const { booking, selectSeats } = useBooking()
  const navigate = useNavigate()
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState([]) // array of seat_id
  const maxSeats = kursiDibutuhkan(booking.search.penumpang) || 1

  useEffect(() => {
    if (!booking.selectedBus) return
    setLoading(true)
    api.getKursi(booking.selectedBus.id)
      .then(setSeats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [booking.selectedBus])

  if (!booking.selectedBus) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Belum ada bus yang dipilih.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Ke Beranda</button>
      </div>
    )
  }

  const toggleSeat = (seat) => {
    if (seat.status !== 'empty') return
    setChosen((c) => {
      if (c.includes(seat.seat_id)) return c.filter((s) => s !== seat.seat_id)
      if (c.length >= maxSeats) return c
      return [...c, seat.seat_id]
    })
  }

  const lanjut = () => {
    if (chosen.length !== maxSeats) return
    const nomorKursi = seats
      .filter((s) => chosen.includes(s.seat_id))
      .map((s) => s.nomor)
    selectSeats({ seatIds: chosen, nomor: nomorKursi })
    navigate('/pemesanan/penumpang')
  }

  const cols = ['A', 'B', 'C', 'D']
  const rows = Math.ceil(seats.length / cols.length)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-xl md:text-2xl font-bold text-navy-900 mb-1">Pilih Kursi</h1>
      <p className="text-sm text-gray-500 mb-6">
        {booking.selectedBus.operator} · {booking.selectedBus.kategori} · Pilih {maxSeats} kursi
        {booking.search.penumpang.bayi > 0 && (
          <> · {booking.search.penumpang.bayi} bayi (dipangku, tidak butuh kursi)</>
        )}
      </p>

      {loading && <p className="text-sm text-gray-500">Memuat layout kursi...</p>}
      {error && <p className="text-sm text-brand-red">{error}</p>}

      {!loading && !error && (
        <div className="card max-w-sm mx-auto">
          <div className="flex justify-end mb-4 text-gray-400 text-xs">🚍 Depan</div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: rows }).map((_, r) =>
              cols.map((c, ci) => {
                const seat = seats.find((s) => s.nomor === `${c}${r + 1}`)
                if (!seat) return <div key={`${c}${r + 1}`} />
                const isChosen = chosen.includes(seat.seat_id)
                const terisi = seat.status !== 'empty'
                return (
                  <button
                    key={seat.seat_id}
                    onClick={() => toggleSeat(seat)}
                    disabled={terisi}
                    className={`h-10 rounded-md text-xs font-semibold flex items-center justify-center transition-colors
                      ${ci === 1 ? 'mr-3' : ''}
                      ${terisi ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isChosen ? 'bg-brand-red text-white' : 'bg-navy-900/10 text-navy-900 hover:bg-navy-900/20'}
                    `}
                  >
                    {seat.nomor}
                  </button>
                )
              })
            )}
          </div>

          <div className="flex gap-4 mt-5 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-navy-900/10 inline-block" /> Tersedia</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-red inline-block" /> Dipilih</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Terisi</span>
          </div>
        </div>
      )}

      <div className="max-w-sm mx-auto mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{chosen.length}/{maxSeats} kursi dipilih</p>
        <button disabled={chosen.length !== maxSeats} onClick={lanjut} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
          Lanjutkan
        </button>
      </div>
    </div>
  )
}
