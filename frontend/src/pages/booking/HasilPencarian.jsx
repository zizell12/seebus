import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, Wifi } from 'lucide-react'
import { useBooking, totalPenumpang, kursiDibutuhkan } from '../../context/BookingContext'
import { api } from '../../utils/api'

export default function HasilPencarian() {
  const { booking, selectBus } = useBooking()
  const navigate = useNavigate()
  const { dari, tujuan, tanggal, penumpang } = booking.search

  const [hasil, setHasil] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!dari || !tujuan) return

    setLoading(true)
    api.cariJadwal({ dari, tujuan, tanggal })
      .then(setHasil)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [dari, tujuan, tanggal])

  if (!dari || !tujuan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Belum ada pencarian. Silakan cari rute terlebih dahulu dari Beranda.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Ke Beranda</button>
      </div>
    )
  }

  const kursiPerlu = kursiDibutuhkan(penumpang)

  const pilihBus = (bus) => {
    selectBus({
      id: bus.availability_id,
      operator: bus.operator,
      kategori: bus.kategori,
      fasilitas: bus.fasilitas,
      dari: bus.dari,
      tujuan: bus.tujuan,
      jamBerangkat: bus.jam_berangkat,
      harga: bus.harga.adult,
    })
    navigate('/pemesanan/kursi')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-xl md:text-2xl font-bold text-navy-900 mb-1">
        {dari} → {tujuan}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {tanggal} · {totalPenumpang(penumpang)} penumpang · Pilih kategori bus
      </p>

      {loading && <p className="text-sm text-gray-500">Mencari jadwal...</p>}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {!loading && !error && hasil.length === 0 && (
        <p className="text-sm text-gray-500">Tidak ada jadwal untuk rute & tanggal ini.</p>
      )}

      <div className="space-y-4">
        {hasil.map((bus) => (
          <div key={bus.availability_id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-navy-900">{bus.operator}</span>
                <span className="text-xs bg-navy-900 text-white px-2 py-0.5 rounded-full">{bus.kategori}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Berangkat {bus.jam_berangkat}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {bus.kursi_tersedia} kursi tersedia</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {bus.fasilitas.map((f) => (
                  <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-navy-900 font-extrabold text-lg">Rp {bus.harga.adult.toLocaleString('id-ID')}</p>
              <button
                onClick={() => pilihBus(bus)}
                disabled={bus.kursi_tersedia < kursiPerlu}
                className="btn-primary mt-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bus.kursi_tersedia < kursiPerlu ? 'Kursi tidak cukup' : 'Pilih Bus'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
