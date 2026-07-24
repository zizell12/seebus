import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'

function parseSeatCode(code) {
  const match = code.match(/^([A-Z]+)(\d+)$/)
  return match
    ? { letter: match[1], number: Number(match[2]) }
    : { letter: code, number: 0 }
}

function sortSeats(a, b) {
  const first = parseSeatCode(a.nomor)
  const second = parseSeatCode(b.nomor)
  if (first.number !== second.number) return first.number - second.number
  return first.letter.localeCompare(second.letter)
}

export default function SeatPickerModal({ open, onClose, jumlahKursi, seats = [], loading = false, error = null, onConfirm }) {
  const [dipilih, setDipilih] = useState([])
  const sortedSeats = useMemo(() => [...seats].sort(sortSeats), [seats])
  const seatMap = useMemo(() => new Map(seats.map((seat) => [seat.nomor, seat])), [seats])

  if (!open) return null

  const toggleKursi = (seat) => {
    if (seat.status !== 'empty') return
    setDipilih((prev) => {
      if (prev.includes(seat.nomor)) return prev.filter((k) => k !== seat.nomor)
      if (prev.length >= jumlahKursi) return prev
      return [...prev, seat.nomor]
    })
  }

  const statusKursi = (kode) => {
    if (dipilih.includes(kode)) return 'dipilih'
    const seat = seatMap.get(kode)
    if (!seat) return 'unknown'
    return seat.status
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-900">Pilih Kursi Anda</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100 border inline-block" /> Tersedia
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-300 inline-block" /> Booking
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-navy-900 inline-block" /> Dipilih
            </span>
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-center text-xs text-gray-400 mb-3">Depan</p>
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-8">Memuat layout kursi...</div>
          ) : error ? (
            <div className="text-center text-sm text-red-500 py-8">{error}</div>
          ) : sortedSeats.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">Tidak ada data kursi.</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 justify-center max-w-[360px] mx-auto">
              {sortedSeats.map((seat) => {
                const status = statusKursi(seat.nomor)
                const isDisabled = status !== 'empty' && status !== 'dipilih'
                return (
                  <button
                    key={seat.nomor}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleKursi(seat)}
                    className={`text-[10px] font-medium rounded-md py-2 ${status === 'dipilih' ? 'bg-navy-900 text-white' : status === 'booked' || status === 'locked' ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {seat.nomor}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          disabled={dipilih.length !== jumlahKursi}
          onClick={() => onConfirm(dipilih)}
          className="w-full bg-navy-900 text-white rounded-xl py-3 mt-6 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Isi Detail Penumpang ({dipilih.length}/{jumlahKursi})
        </button>
      </div>
    </div>
  )
}
