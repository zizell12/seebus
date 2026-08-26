import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Route as RouteIcon, Clock, Sparkles } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function formatDurasi(t, menit) {
  if (menit === '' || menit === null || menit === undefined) return t.adminRutePage.tanpaDurasi
  const angka = Number(menit)
  const jam = Math.floor(angka / 60)
  const sisaMenit = angka % 60
  if (jam > 0) {
    return t.adminRutePage.jamMenitFormat.replace('{jam}', jam).replace('{menit}', sisaMenit)
  }
  return t.adminRutePage.menitFormat.replace('{menit}', sisaMenit)
}

export default function AdminRuteForm() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item || null : null

  const [options, setOptions] = useState({ stations: [] })
  const [originId, setOriginId] = useState(initial?.origin_station_id || '')
  const [destinationId, setDestinationId] = useState(initial?.destination_station_id || '')
  const [jarak, setJarak] = useState(initial?.rt_distance_km ?? '')
  const [durasi, setDurasi] = useState(initial?.rt_duration_min ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminRouteOptions().then(setOptions).catch(() => {})
  }, [])

  // Kalau halaman edit diakses langsung (mis. refresh) tanpa data item yang
  // dikirim lewat state navigasi, tidak ada endpoint getById di backend,
  // jadi kita arahkan kembali ke daftar rute.
  if (isEdit && !initial) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">{t.adminRutePage.kosong}</p>
        <Link
          to="/admin/rute"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminRutePage.kembali}
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (originId && destinationId && String(originId) === String(destinationId)) {
      setError(t.adminRutePage.validasiAsalTujuanSama)
      return
    }
    setError('')
    setSubmitting(true)
    const payload = {
      origin_station_id: Number(originId),
      destination_station_id: Number(destinationId),
      rt_distance_km: jarak === '' ? null : Number(jarak),
      rt_duration_min: durasi === '' ? null : Number(durasi),
    }
    try {
      if (isEdit) {
        await api.ubahRoute(initial.route_id, payload)
        navigate('/admin/rute', { state: { notice: t.adminRutePage.berhasilUbah } })
      } else {
        await api.tambahRoute(payload)
        navigate('/admin/rute', { state: { notice: t.adminRutePage.berhasilTambah } })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">
            {isEdit ? t.adminRutePage.formEditJudul : t.adminRutePage.formTambahJudul}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminRutePage.subJudul}</p>
        </div>
        <Link
          to="/admin/rute"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminRutePage.kembali}
        </Link>
      </div>

      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="card space-y-4 lg:col-span-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminRutePage.labelAsal}</label>
            <select
              required
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="">{t.adminRutePage.pilihAsal}</option>
              {options.stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminRutePage.labelTujuan}</label>
            <select
              required
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="">{t.adminRutePage.pilihTujuan}</option>
              {options.stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminRutePage.labelJarak}</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={jarak}
                onChange={(e) => setJarak(e.target.value)}
                placeholder={t.adminRutePage.placeholderJarak}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminRutePage.labelDurasi}</label>
              <input
                type="number"
                min="1"
                value={durasi}
                onChange={(e) => setDurasi(e.target.value)}
                placeholder={t.adminRutePage.placeholderDurasi}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/rute')}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              {t.adminRutePage.batal}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? t.adminRutePage.menyimpan : t.adminRutePage.simpan}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t.adminRutePage.previewJudul}
          </p>
          <div className="card">
            <div className="flex items-start gap-2 mb-3">
              <RouteIcon className="w-4 h-4 text-navy-900 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap font-bold text-navy-900">
                  <span className="truncate">
                    {options.stations.find((s) => String(s.station_id) === String(originId))?.label ||
                      t.adminRutePage.pilihAsal}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">
                    {options.stations.find((s) => String(s.station_id) === String(destinationId))?.label ||
                      t.adminRutePage.pilihTujuan}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                {t.adminRutePage.kolomJarak}:{' '}
                <span className="font-semibold text-navy-900">
                  {jarak !== '' ? `${jarak} km` : t.adminRutePage.tanpaJarak}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold text-navy-900">{formatDurasi(t, durasi)}</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2.5">{t.adminRutePage.previewKeterangan}</p>
        </div>
      </div>
    </div>
  )
}
