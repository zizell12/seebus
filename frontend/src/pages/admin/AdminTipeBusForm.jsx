import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, X, Building2, Users, Sparkles } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function FasilitasPicker({ t, fasilitasUmum, value, onChange }) {
  const [custom, setCustom] = useState('')

  const toggle = (nama) => {
    if (value.includes(nama)) {
      onChange(value.filter((f) => f !== nama))
    } else {
      onChange([...value, nama])
    }
  }

  const tambahCustom = () => {
    const nama = custom.trim()
    if (!nama || value.includes(nama)) return
    onChange([...value, nama])
    setCustom('')
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t.adminTipeBusPage.labelFasilitas}</label>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {fasilitasUmum.map((f) => {
          const aktif = value.includes(f)
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                aktif
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mb-2.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              tambahCustom()
            }
          }}
          placeholder={t.adminTipeBusPage.placeholderFasilitasCustom}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
        <button
          type="button"
          onClick={tambahCustom}
          className="text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          {t.adminTipeBusPage.tambahFasilitas}
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full"
            >
              {f}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== f))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminTipeBusForm() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item || null : null

  const [options, setOptions] = useState({ company_name: '', fasilitas_umum: [] })
  const [namaTipe, setNamaTipe] = useState(initial?.bt_name || '')
  const [kapasitas, setKapasitas] = useState(initial?.bt_capacity ?? '')
  const [fasilitas, setFasilitas] = useState(initial?.bt_facilities || [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminBusTypeOptions().then(setOptions).catch(() => {})
  }, [])

  // Kalau halaman edit diakses langsung (mis. refresh) tanpa data item yang
  // dikirim lewat state navigasi, tidak ada endpoint getById di backend,
  // jadi kita arahkan kembali ke daftar tipe bus.
  if (isEdit && !initial) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">{t.adminTipeBusPage.kosong}</p>
        <Link
          to="/admin/tipe-bus"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminTipeBusPage.kembali}
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const payload = {
      bt_name: namaTipe,
      bt_capacity: Number(kapasitas),
      bt_facilities: fasilitas,
    }
    try {
      if (isEdit) {
        await api.ubahBusType(initial.bus_type_id, payload)
        navigate('/admin/tipe-bus', { state: { notice: t.adminTipeBusPage.berhasilUbah } })
      } else {
        await api.tambahBusType(payload)
        navigate('/admin/tipe-bus', { state: { notice: t.adminTipeBusPage.berhasilTambah } })
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
            {isEdit ? t.adminTipeBusPage.formEditJudul : t.adminTipeBusPage.formTambahJudul}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminTipeBusPage.subJudul}</p>
        </div>
        <Link
          to="/admin/tipe-bus"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminTipeBusPage.kembali}
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
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminTipeBusPage.labelPerusahaan}</label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              {options.company_name || '-'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminTipeBusPage.labelNamaTipe}</label>
              <input
                required
                value={namaTipe}
                onChange={(e) => setNamaTipe(e.target.value)}
                placeholder={t.adminTipeBusPage.placeholderNamaTipe}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminTipeBusPage.labelKapasitas}</label>
              <input
                required
                type="number"
                min="1"
                max="100"
                value={kapasitas}
                onChange={(e) => setKapasitas(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          <FasilitasPicker t={t} fasilitasUmum={options.fasilitas_umum || []} value={fasilitas} onChange={setFasilitas} />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/tipe-bus')}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              {t.adminTipeBusPage.batal}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? t.adminTipeBusPage.menyimpan : t.adminTipeBusPage.simpan}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {t.adminTipeBusPage.previewJudul}
            </p>
            <div className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-navy-900 truncate">
                    {namaTipe || t.adminTipeBusPage.placeholderNamaTipe}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" /> {options.company_name || '-'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 bg-navy-900/5 px-2.5 py-1 rounded-full shrink-0">
                  <Users className="w-3.5 h-3.5" /> {kapasitas || 0}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                {fasilitas.length === 0 && (
                  <span className="text-xs text-gray-400">{t.adminTipeBusPage.tanpaFasilitas}</span>
                )}
                {fasilitas.map((f) => (
                  <span
                    key={f}
                    className="text-[11px] font-semibold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2.5">{t.adminTipeBusPage.previewKeterangan}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
