import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, X, Building2, Users, Sparkles, ChevronDown, Plus } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

// Combo pencarian PO bus: bisa pilih dari daftar perusahaan yang sudah ada,
// atau ketik nama baru untuk membuat PO baru sekaligus saat form disimpan.
function PerusahaanPicker({ t, companies, companyId, companyName, onSelect, onTypeNew }) {
  const [query, setQuery] = useState(companyName || '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) setQuery(companyName || '')
  }, [companyName, open])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery(companyName || '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName])

  const kata = query.trim().toLowerCase()
  const filtered = kata ? companies.filter((c) => c.co_name.toLowerCase().includes(kata)) : companies
  const cocokPersis = companies.some((c) => c.co_name.toLowerCase() === kata)

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={open ? query : companyName || ''}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t.adminTipeBusPage.placeholderPerusahaan}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 && !kata && (
            <p className="px-3 py-2 text-sm text-gray-400">{t.adminTipeBusPage.tidakAdaPerusahaan}</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.company_id}
              type="button"
              onClick={() => {
                onSelect(c)
                setQuery(c.co_name)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                String(c.company_id) === String(companyId) ? 'text-navy-900 font-semibold bg-gray-50' : 'text-gray-600'
              }`}
            >
              {c.co_name}
            </button>
          ))}
          {kata && !cocokPersis && (
            <button
              type="button"
              onClick={() => {
                onTypeNew(query.trim())
                setOpen(false)
              }}
              className="w-full flex items-center gap-1.5 text-left px-3 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 border-t border-gray-100"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              {t.adminTipeBusPage.tambahPerusahaanBaru.replace('{query}', query.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

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

  const [options, setOptions] = useState({ companies: [], fasilitas_umum: [] })
  const [companyId, setCompanyId] = useState(initial?.company_id ? String(initial.company_id) : '')
  const [companyName, setCompanyName] = useState(initial?.company_name || '')
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
    if (!companyId && !companyName.trim()) {
      setError(t.adminTipeBusPage.errorPerusahaan)
      return
    }
    setSubmitting(true)
    setError('')
    const payload = {
      bt_name: namaTipe,
      bt_capacity: Number(kapasitas),
      bt_facilities: fasilitas,
      ...(companyId ? { company_id: Number(companyId) } : { company_name: companyName.trim() }),
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
            <PerusahaanPicker
              t={t}
              companies={options.companies || []}
              companyId={companyId}
              companyName={companyName}
              onSelect={(c) => {
                setCompanyId(String(c.company_id))
                setCompanyName(c.co_name)
              }}
              onTypeNew={(nama) => {
                setCompanyId('')
                setCompanyName(nama)
              }}
            />
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
                    <Building2 className="w-3.5 h-3.5 shrink-0" /> {companyName || '-'}
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
