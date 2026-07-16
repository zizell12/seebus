import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'

export default function DataPenumpang() {
  const { booking, setPassengers } = useBooking()
  const navigate = useNavigate()

  const seatIds = booking.selectedSeats?.seatIds || []
  const nomorKursi = booking.selectedSeats?.nomor || []

  const [data, setData] = useState(
    seatIds.map((seatId, i) => ({
      seat_id: seatId,
      nomor: nomorKursi[i],
      nama: '',
      nik: '',
      jenisKelamin: 'Laki-laki',
    }))
  )

  if (!booking.selectedBus || seatIds.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Belum ada kursi yang dipilih.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Ke Beranda</button>
      </div>
    )
  }

  const updateField = (idx, field, value) => {
    setData((d) => d.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setPassengers(data)
    navigate('/pemesanan/pembayaran')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-xl md:text-2xl font-bold text-navy-900 mb-1">Data Penumpang</h1>
      <p className="text-sm text-gray-500 mb-6">Lengkapi data untuk setiap kursi yang dipilih.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {data.map((p, idx) => (
          <div key={p.seat_id} className="card">
            <h3 className="font-bold text-navy-900 mb-3">Penumpang {idx + 1} · Kursi {p.nomor}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-navy-900">Nama Lengkap</label>
                <input required value={p.nama} onChange={(e) => updateField(idx, 'nama', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900" />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-900">NIK</label>
                <input required value={p.nik} onChange={(e) => updateField(idx, 'nik', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900" />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-900">Jenis Kelamin</label>
                <select value={p.jenisKelamin} onChange={(e) => updateField(idx, 'jenisKelamin', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900">
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <button className="btn-primary w-full">Lanjut ke Pembayaran</button>
      </form>
    </div>
  )
}
