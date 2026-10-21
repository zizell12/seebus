import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Pencil, Plus, Power, RefreshCcw, Trash2 } from 'lucide-react'
import { api } from '../../utils/api'

const HARI = [
  [1, 'Sen'], [2, 'Sel'], [3, 'Rab'], [4, 'Kam'], [5, 'Jum'], [6, 'Sab'], [0, 'Min'],
]

export default function AdminJadwalTetap() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [days, setDays] = useState('30')
  const [result, setResult] = useState(null)

  const muatTemplates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getAdminJadwalTetap()
      setTemplates(response.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { muatTemplates() }, [muatTemplates])

  const generate = async (templateId) => {
    setError('')
    setResult(null)
    setActionLoading(templateId || 'all')
    try {
      setResult(await api.generateJadwalTetap({
        hari: Number(days),
        ...(templateId ? { template_id: templateId } : {}),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
      await muatTemplates()
    }
  }

  const toggle = async (item) => {
    setActionLoading(item.schedule_template_id)
    setError('')
    try {
      await api.toggleJadwalTetap(item.schedule_template_id)
      await muatTemplates()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Hapus jadwal tetap ${item.label_rute}, ${item.departure_time}?`)) return
    setActionLoading(item.schedule_template_id)
    setError('')
    try {
      await api.hapusJadwalTetap(item.schedule_template_id)
      await muatTemplates()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">Jadwal Tetap</h1>
          <p className="text-sm text-gray-500 mt-1">Atur keberangkatan berulang dan buat jadwal untuk beberapa hari ke depan.</p>
        </div>
        <Link to="/admin/jadwal-tetap/tambah" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90">
          <Plus className="w-4 h-4" /> Tambah jadwal tetap
        </Link>
      </div>

      {error && <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">{error}</div>}

      <section className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label htmlFor="generate-days" className="block text-xs font-semibold text-gray-500 mb-1.5">Rentang generate (hari)</label>
            <input id="generate-days" type="number" min="1" max="60" value={days} onChange={(event) => setDays(event.target.value)} className="w-full sm:max-w-xs border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <p className="text-xs text-gray-400 mt-1">Maksimal 60 hari. Jadwal yang sudah ada, lewat waktu, atau bentrok akan dilewati.</p>
          </div>
          <button onClick={() => generate()} disabled={actionLoading !== null || Number(days) < 1 || Number(days) > 60} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-navy-900 px-4 py-2.5 rounded-lg disabled:opacity-50">
            <RefreshCcw className="w-4 h-4" /> {actionLoading === 'all' ? 'Membuat jadwal...' : 'Generate semua template'}
          </button>
        </div>
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 border-t border-gray-100 pt-4">
            {[
              ['Dibuat', result.dibuat],
              ['Sudah ada', result.sudah_ada],
              ['Lewat waktu', result.lewat_waktu],
              ['Bentrok', result.bentrok],
              ['Template dilewati', result.template_dilewati],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-lg font-bold text-navy-900">{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading && <p className="text-sm text-gray-400 text-center py-10">Memuat jadwal tetap...</p>}
      {!loading && !error && templates.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Belum ada template jadwal tetap.</p>}
      {!loading && templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((item) => (
            <article key={item.schedule_template_id} className="card flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900 shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-navy-900">{item.label_rute}</h2>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-brand-teal/10 text-brand-teal' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.departure_time} · {item.armada} · {item.perusahaan || 'PO tidak diketahui'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(item.days_of_week || []).sort((a, b) => HARI.findIndex(([day]) => day === a) - HARI.findIndex(([day]) => day === b))
                      .map((day) => HARI.find(([value]) => value === day)?.[1])
                      .filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/jadwal-tetap/edit/${item.schedule_template_id}`} state={{ item }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button onClick={() => toggle(item)} disabled={actionLoading === item.schedule_template_id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  <Power className="w-3.5 h-3.5" /> {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => generate(item.schedule_template_id)} disabled={actionLoading !== null} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal border border-brand-teal/20 px-3 py-2 rounded-lg hover:bg-brand-teal/5 disabled:opacity-50">
                  <RefreshCcw className="w-3.5 h-3.5" /> Generate
                </button>
                <button onClick={() => remove(item)} disabled={actionLoading === item.schedule_template_id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red border border-brand-red/20 px-3 py-2 rounded-lg hover:bg-brand-red/5 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
