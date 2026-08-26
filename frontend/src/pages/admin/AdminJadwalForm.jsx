import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminJadwalForm() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item || null : null

  const [options, setOptions] = useState({ routes: [], bus_types: [] })
  const [routeId, setRouteId] = useState(initial?.route_id || '')
  const [busTypeId, setBusTypeId] = useState(initial?.bus_type_id || '')
  const [tanggal, setTanggal] = useState(initial?.av_date || '')
  const [jam, setJam] = useState(initial?.av_time || '')
  const [hargaDewasa, setHargaDewasa] = useState(initial?.av_price?.adult ?? '')
  const [hargaAnak, setHargaAnak] = useState(initial?.av_price?.child ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminJadwalOptions().then(setOptions).catch(() => {})
  }, [])

  // Kalau halaman edit diakses langsung (mis. refresh) tanpa data item yang
  // dikirim lewat state navigasi, tidak ada endpoint getById di backend,
  // jadi kita arahkan kembali ke daftar jadwal.
  if (isEdit && !initial) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">{t.adminJadwalPage.kosong}</p>
        <Link
          to="/admin/jadwal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminJadwalPage.kembali}
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await api.ubahJadwal(initial.availability_id, {
          av_time: jam,
          av_price: { adult: Number(hargaDewasa), child: Number(hargaAnak) },
        })
        navigate('/admin/jadwal', { state: { notice: t.adminJadwalPage.berhasilUbah } })
      } else {
        await api.tambahJadwal({
          route_id: routeId,
          bus_type_id: busTypeId,
          av_date: tanggal,
          av_time: jam,
          av_price: { adult: Number(hargaDewasa), child: Number(hargaAnak) },
        })
        navigate('/admin/jadwal', { state: { notice: t.adminJadwalPage.berhasilTambah } })
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
            {isEdit ? t.adminJadwalPage.formEditJudul : t.adminJadwalPage.formTambahJudul}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminJadwalPage.subJudul}</p>
        </div>
        <Link
          to="/admin/jadwal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminJadwalPage.kembali}
        </Link>
      </div>

      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="card space-y-4 lg:col-span-2">
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelRute}</label>
              <select
                required
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              >
                <option value="">{t.adminJadwalPage.pilihRute}</option>
                {options.routes.map((r) => (
                  <option key={r.route_id} value={r.route_id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelTipeBus}</label>
              <select
                required
                value={busTypeId}
                onChange={(e) => setBusTypeId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              >
                <option value="">{t.adminJadwalPage.pilihTipeBus}</option>
                {options.bus_types.map((bt) => (
                  <option key={bt.bus_type_id} value={bt.bus_type_id}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelTanggal}</label>
                <input
                  required
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelJam}</label>
              <input
                required
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelHargaDewasa}</label>
              <input
                required
                type="number"
                min="0"
                value={hargaDewasa}
                onChange={(e) => setHargaDewasa(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelHargaAnak}</label>
              <input
                required
                type="number"
                min="0"
                value={hargaAnak}
                onChange={(e) => setHargaAnak(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/jadwal')}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              {t.adminJadwalPage.batal}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? t.adminJadwalPage.menyimpan : t.adminJadwalPage.simpan}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t.adminJadwalPage.previewJudul}
          </p>
          <div className="card">
            <div className="flex items-center gap-1.5 font-medium text-navy-900 mb-0.5">
              {isEdit ? (
                <>
                  <span className="truncate">{initial.terminal_asal}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{initial.terminal_tujuan}</span>
                </>
              ) : (
                <span className="truncate">
                  {options.routes.find((r) => String(r.route_id) === String(routeId))?.label ||
                    t.adminJadwalPage.pilihRute}
                </span>
              )}
            </div>
            {isEdit && (
              <p className="text-xs text-gray-400 mb-3">
                {initial.kota_asal} → {initial.kota_tujuan}
              </p>
            )}

            <p className="text-navy-900 text-sm mt-3">
              {(isEdit ? initial.av_date : tanggal) || '-'} {jam && `· ${jam}`}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {isEdit
                ? initial.bt_name
                : options.bus_types.find((bt) => String(bt.bus_type_id) === String(busTypeId))?.label ||
                  t.adminJadwalPage.pilihTipeBus}
            </p>

            <div className="pt-3 border-t border-gray-100 text-sm">
              <p className="text-navy-900">
                Rp {Number(hargaDewasa || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-400">
                Rp {Number(hargaAnak || 0).toLocaleString('id-ID')} ({t.adminJadwalPage.labelHargaAnak.split(' ')[0]})
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2.5">{t.adminJadwalPage.previewKeterangan}</p>
        </div>
      </div>
    </div>
  )
}
