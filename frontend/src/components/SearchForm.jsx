import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ArrowRightLeft } from 'lucide-react'
import { useBooking } from '../context/BookingContext'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../utils/api'
import PenumpangPicker from './PenumpangPicker'

export default function SearchForm() {
  const navigate = useNavigate()
  const { updateSearch } = useBooking()
  const { t } = useLanguage()
  const [kotaList, setKotaList] = useState([])
  const [loadingKota, setLoadingKota] = useState(true)
  const [form, setForm] = useState({
    dari: '',
    tujuan: '',
    tanggal: '',
    penumpang: { dewasa: 1, anak: 0, bayi: 0 },
  })
  const [error, setError] = useState('')

  useEffect(() => {
    api.getWilayah()
      .then(setKotaList)
      .catch(() => setError('Gagal memuat daftar kota. Coba refresh halaman.'))
      .finally(() => setLoadingKota(false))
  }, [])

  const swap = () => setForm((f) => ({ ...f, dari: f.tujuan, tujuan: f.dari }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.dari || !form.tujuan || !form.tanggal) {
      setError(t.search.lengkapiForm)
      return
    }
    if (form.dari === form.tujuan) {
      setError(t.search.kotaSama)
      return
    }
    setError('')
    updateSearch(form)
    navigate('/pencarian')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 md:p-5">
      {error && <p className="text-sm text-brand-red mb-3">{error}</p>}

      {/* 6 kolom: Dari, tombol swap, Tujuan, Tanggal, Penumpang, tombol Cari Bus — semua sejajar 1 baris di layar besar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] gap-3 items-end">
        <Field label={t.search.dari} icon={<MapPin className="w-4 h-4" />}>
          <select
            className="w-full outline-none text-sm text-navy-900 bg-transparent"
            value={form.dari}
            disabled={loadingKota}
            onChange={(e) => setForm({ ...form, dari: e.target.value })}
          >
            <option value="">{loadingKota ? t.search.memuat : t.search.pilihKotaAsal}</option>
            {kotaList.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>

        <div className="flex md:justify-center">
          <button
            type="button"
            onClick={swap}
            className="p-2 rounded-full border text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
            aria-label="Tukar kota"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        <Field label={t.search.tujuan} icon={<MapPin className="w-4 h-4" />}>
          <select
            className="w-full outline-none text-sm text-navy-900 bg-transparent"
            value={form.tujuan}
            disabled={loadingKota}
            onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
          >
            <option value="">{loadingKota ? t.search.memuat : t.search.pilihKotaTujuan}</option>
            {kotaList.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>

        <Field label={t.search.tanggal} icon={<Calendar className="w-4 h-4" />}>
          <input
            type="date"
            className="w-full outline-none text-sm text-navy-900 bg-transparent"
            value={form.tanggal}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
          />
        </Field>

        <div className="border rounded-lg px-3 py-2">
          <PenumpangPicker
            value={form.penumpang}
            onChange={(penumpang) => setForm({ ...form, penumpang })}
          />
        </div>

        <button type="submit" className="btn-primary h-[46px] px-6 whitespace-nowrap">
          {t.search.cariBus}
        </button>
      </div>
    </form>
  )
}

function Field({ label, icon, children }) {
  return (
    <div className="border rounded-lg px-3 py-2">
      <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
        {icon} {label}
      </label>
      {children}
    </div>
  )
}
