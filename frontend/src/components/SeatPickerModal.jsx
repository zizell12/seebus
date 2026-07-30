import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function parseSeatCode(code) {
  const match = code.match(/^([A-Z]+)(\d+)$/)
  return match
    ? { letter: match[1], number: Number(match[2]) }
    : { letter: code, number: 0 }
}

// Susunan kursi kiri-kanan berbeda tergantung jumlah kolom per baris:
// 2 kolom (Sleeper) -> 1 kiri, 1 kanan (kabin individu kiri-kanan lorong)
// 3 kolom (Eksekutif) -> 2 kiri, 1 kanan
// 5 kolom (Ekonomi) -> 2 kiri, 3 kanan
// Selain itu, fallback dibagi rata (bulatkan ke atas untuk sisi kiri).
function splitKiriKanan(totalKolom) {
  const preset = { 2: 1, 3: 2, 5: 2 }
  const kiri = preset[totalKolom] ?? Math.ceil(totalKolom / 2)
  return { kiri, kanan: totalKolom - kiri }
}

function sortSeats(a, b) {
  const first = parseSeatCode(a.nomor)
  const second = parseSeatCode(b.nomor)
  if (first.number !== second.number) return first.number - second.number
  return first.letter.localeCompare(second.letter)
}

export default function SeatPickerModal({ open, onClose, jumlahKursi, seats = [], loading = false, error = null, onConfirm, initialSelected = [] }) {
  const { t } = useLanguage()
  const [dipilih, setDipilih] = useState(initialSelected)
  useEffect(() => {
    if (open) setDipilih(initialSelected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const sortedSeats = useMemo(() => [...seats].sort(sortSeats), [seats])
  const seatMap = useMemo(() => new Map(seats.map((seat) => [seat.nomor, seat])), [seats])

  // Kelompokkan kursi per baris (berdasarkan nomor) agar bisa digambar dengan lorong (aisle)
  // di tengah, meniru interior bus sungguhan alih-alih grid rata tanpa jarak.
  const rows = useMemo(() => {
    const map = new Map()
    sortedSeats.forEach((seat) => {
      const { number } = parseSeatCode(seat.nomor)
      if (!map.has(number)) map.set(number, [])
      map.get(number).push(seat)
    })
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [sortedSeats])

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

  const seatButton = (seat) => {
    const status = statusKursi(seat.nomor)
    const isDisabled = status !== 'empty' && status !== 'dipilih'
    return (
      <button
        key={seat.nomor}
        type="button"
        disabled={isDisabled}
        onClick={() => toggleKursi(seat)}
        className={`w-11 h-11 text-[10px] font-medium rounded-md flex items-center justify-center ${status === 'dipilih' ? 'bg-navy-900 text-white' : status === 'booked' || status === 'locked' ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        {seat.nomor}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-900">{t.seatModal.judul}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100 border inline-block" /> {t.seatModal.tersedia}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-300 inline-block" /> {t.seatModal.booking}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-navy-900 inline-block" /> {t.seatModal.dipilih}
            </span>
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-center text-xs text-gray-400 mb-3">{t.seatModal.depan}</p>
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-8">{t.seatModal.memuat}</div>
          ) : error ? (
            <div className="text-center text-sm text-red-500 py-8">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">{t.seatModal.tidakAdaData}</div>
          ) : (
            <div className="space-y-2 max-w-[280px] mx-auto">
              {rows.map(([rowNumber, rowSeats]) => {
                const { kiri: jumlahKiri } = splitKiriKanan(rowSeats.length)
                const kiri = rowSeats.slice(0, jumlahKiri)
                const kanan = rowSeats.slice(jumlahKiri)
                return (
                  <div key={rowNumber} className="flex items-center justify-center gap-2">
                    <div className="flex gap-2">{kiri.map(seatButton)}</div>
                    {kanan.length > 0 && <div className="w-6" />}
                    <div className="flex gap-2">{kanan.map(seatButton)}</div>
                  </div>
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
          {t.seatModal.simpan} ({dipilih.length}/{jumlahKursi})
        </button>
      </div>
    </div>
  )
}
