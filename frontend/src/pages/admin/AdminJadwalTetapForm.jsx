import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../utils/api'

const DAYS = [
  [1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [0, 'Minggu'],
]

export default function AdminJadwalTetapForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item : null
  const [options, setOptions] = useState({ routes: [], bus_units: [] })
  const [routeId, setRouteId] = useState(initial?.route_id ? String(initial.route_id) : '')
  const [busUnitId, setBusUnitId] = useState(initial?.bus_unit_id ? String(initial.bus_unit_id) : '')
  const [time, setTime] = useState(initial?.departure_time || '')
  const [days, setDays] = useState(initial?.days_of_week || [])
  const [active, setActive] = useState(initial?.is_active ?? true)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminJadwalOptions()
      .then(setOptions)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false))
  }, [])

  if (isEdit && !initial) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">Data jadwal tetap tidak ditemukan. Kembali ke daftar untuk memilih template.</p>
        <Link to="/admin/jadwal-tetap" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>
    )
  }

  const toggleDay = (day) => {
    setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        route_id: Number(routeId),
        bus_unit_id: Number(busUnitId),
        departure_time: time,
        days_of_week: days,
        is_active: active,
      }
      if (isEdit) {
        await api.ubahJadwalTetap(initial.schedule_template_id, payload)
      } else {
        await api.tambahJadwalTetap(payload)
      }
      navigate('/admin/jadwal-tetap')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{isEdit ? 'Edit Jadwal Tetap' : 'Tambah Jadwal Tetap'}</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih rute, armada, jam keberangkatan, dan hari berulang.</p>
        </div>
        <Link to="/admin/jadwal-tetap" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>

      {error && <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">{error}</div>}
      <form onSubmit={submit} className="card max-w-3xl space-y-5">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Rute</span>
          <select required value={routeId} onChange={(event) => setRouteId(event.target.value)} disabled={loadingOptions} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
            <option value="">Pilih rute</option>
            {options.routes.map((route) => (
              <option key={route.route_id} value={route.route_id} disabled={!route.siap_dipakai}>
                {route.label}{route.siap_dipakai ? '' : ` (${route.masalah?.[0] || 'belum siap'})`}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Armada aktif</span>
          <select required value={busUnitId} onChange={(event) => setBusUnitId(event.target.value)} disabled={loadingOptions} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
            <option value="">Pilih armada</option>
            {options.bus_units.map((unit) => <option key={unit.bus_unit_id} value={unit.bus_unit_id}>{unit.label}</option>)}
          </select>
        </label>
        <label className="block max-w-xs">
          <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Jam berangkat</span>
          <input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </label>
        <fieldset>
          <legend className="text-xs font-semibold text-gray-500 mb-2">Hari aktif</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => toggleDay(value)} aria-pressed={days.includes(value)} className={`text-xs px-3 py-1.5 rounded-full border ${days.includes(value) ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
          {days.length === 0 && <p className="text-xs text-brand-red mt-2">Pilih setidaknya satu hari.</p>}
        </fieldset>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Aktifkan template setelah disimpan
        </label>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={() => navigate('/admin/jadwal-tetap')} className="text-sm font-semibold text-gray-500 px-4 py-2.5">Batal</button>
          <button type="submit" disabled={submitting || loadingOptions || days.length === 0} className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? 'Menyimpan...' : 'Simpan jadwal tetap'}
          </button>
        </div>
      </form>
    </div>
  )
}
