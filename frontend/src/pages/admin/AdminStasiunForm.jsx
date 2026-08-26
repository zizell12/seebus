import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Sparkles } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminStasiunForm() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item || null : null

  const [options, setOptions] = useState({ regions: [] })
  const [regionId, setRegionId] = useState(initial?.region_id || '')
  const [nama, setNama] = useState(initial?.stn_name || '')
  const [alamat, setAlamat] = useState(initial?.stn_address || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminStationOptions().then(setOptions).catch(() => {})
  }, [])

  // Kalau halaman edit diakses langsung (mis. refresh) tanpa data item yang
  // dikirim lewat state navigasi, tidak ada endpoint getById di backend,
  // jadi kita arahkan kembali ke daftar terminal.
  if (isEdit && !initial) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">{t.adminStasiunPage.kosong}</p>
        <Link
          to="/admin/terminal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminStasiunPage.kembali}
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const payload = {
      region_id: Number(regionId),
      stn_name: nama,
      stn_address: alamat || null,
    }
    try {
      if (isEdit) {
        await api.ubahStation(initial.station_id, payload)
        navigate('/admin/terminal', { state: { notice: t.adminStasiunPage.berhasilUbah } })
      } else {
        await api.tambahStation(payload)
        navigate('/admin/terminal', { state: { notice: t.adminStasiunPage.berhasilTambah } })
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
            {isEdit ? t.adminStasiunPage.formEditJudul : t.adminStasiunPage.formTambahJudul}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminStasiunPage.subJudul}</p>
        </div>
        <Link
          to="/admin/terminal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminStasiunPage.kembali}
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
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminStasiunPage.labelWilayah}</label>
            <select
              required
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="">{t.adminStasiunPage.pilihWilayah}</option>
              {options.regions.map((r) => (
                <option key={r.region_id} value={r.region_id}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">{t.adminStasiunPage.catatanWilayah}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminStasiunPage.labelNama}</label>
            <input
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder={t.adminStasiunPage.placeholderNama}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminStasiunPage.labelAlamat}</label>
            <input
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder={t.adminStasiunPage.placeholderAlamat}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/terminal')}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              {t.adminStasiunPage.batal}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? t.adminStasiunPage.menyimpan : t.adminStasiunPage.simpan}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t.adminStasiunPage.previewJudul}
          </p>
          <div className="card">
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 text-navy-900 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-navy-900 truncate">
                  {nama || t.adminStasiunPage.placeholderNama}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {options.regions.find((r) => String(r.region_id) === String(regionId))?.label ||
                    t.adminStasiunPage.pilihWilayah}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">{alamat || t.adminStasiunPage.tanpaAlamat}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2.5">{t.adminStasiunPage.previewKeterangan}</p>
        </div>
      </div>
    </div>
  )
}
