import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, X, Search, Users, Building2 } from 'lucide-react'
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

function TipeBusForm({ t, options, initial, onCancel, onSubmit, submitting }) {
  const [companyId, setCompanyId] = useState(initial?.company_id || '')
  const [namaTipe, setNamaTipe] = useState(initial?.bt_name || '')
  const [kapasitas, setKapasitas] = useState(initial?.bt_capacity ?? '')
  const [fasilitas, setFasilitas] = useState(initial?.bt_facilities || [])
  const isEdit = Boolean(initial)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      company_id: companyId,
      bt_name: namaTipe,
      bt_capacity: Number(kapasitas),
      bt_facilities: fasilitas,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-navy-900 text-lg">
            {isEdit ? t.adminTipeBusPage.formEditJudul : t.adminTipeBusPage.formTambahJudul}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminTipeBusPage.labelPerusahaan}</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="">{t.adminTipeBusPage.pilihPerusahaan}</option>
              {options.companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.co_name}
                </option>
              ))}
            </select>
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

          <FasilitasPicker t={t} fasilitasUmum={options.fasilitas_umum} value={fasilitas} onChange={setFasilitas} />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
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
      </div>
    </div>
  )
}

export default function AdminTipeBus() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [options, setOptions] = useState({ companies: [], fasilitas_umum: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [cariAktif, setCariAktif] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [modal, setModal] = useState(null) // null | 'tambah' | item (edit)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  const muatData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getAdminBusType({ cari: cariAktif || undefined, page })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cariAktif, page])

  useEffect(() => {
    muatData()
  }, [muatData])

  useEffect(() => {
    api.getAdminBusTypeOptions().then(setOptions).catch(() => {})
  }, [])

  const handleCariSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setCariAktif(cari)
  }

  const handleTambah = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      await api.tambahBusType(payload)
      setModal(null)
      setNotice(t.adminTipeBusPage.berhasilTambah)
      setPage(1)
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      await api.ubahBusType(modal.bus_type_id, payload)
      setModal(null)
      setNotice(t.adminTipeBusPage.berhasilUbah)
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleHapus = async (item) => {
    if (!window.confirm(t.adminTipeBusPage.konfirmasiHapus)) return
    setActionLoading(item.bus_type_id)
    setError('')
    try {
      await api.hapusBusType(item.bus_type_id)
      setNotice(t.adminTipeBusPage.berhasilHapus)
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const daftar = data?.data || []
  const halamanSekarang = data?.current_page || 1
  const totalHalaman = data?.last_page || 1

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminTipeBusPage.judul}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminTipeBusPage.subJudul}</p>
        </div>
        <button
          onClick={() => setModal('tambah')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.adminTipeBusPage.tambahTipeBus}
        </button>
      </div>

      {notice && (
        <div className="text-sm text-brand-teal bg-brand-teal/10 border border-brand-teal/20 rounded-lg px-4 py-2.5 mb-5">
          {notice}
        </div>
      )}

      <form onSubmit={handleCariSubmit} className="relative max-w-sm mb-5">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={t.adminTipeBusPage.cariPlaceholder}
          className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
      </form>

      {loading && <p className="text-sm text-gray-400 text-center py-10">{t.adminTipeBusPage.memuat}</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{error}</p>
          <button
            onClick={muatData}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminTipeBusPage.muatUlang}
          </button>
        </div>
      )}

      {!loading && !error && daftar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">
          {cariAktif ? t.adminTipeBusPage.tidakDitemukan : t.adminTipeBusPage.kosong}
        </p>
      )}

      {!loading && !error && daftar.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftar.map((item) => (
              <div key={item.bus_type_id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy-900 truncate">{item.bt_name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" /> {item.company_name}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 bg-navy-900/5 px-2.5 py-1 rounded-full shrink-0">
                    <Users className="w-3.5 h-3.5" /> {item.bt_capacity}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
                  {item.bt_facilities.length === 0 && (
                    <span className="text-xs text-gray-400">{t.adminTipeBusPage.tanpaFasilitas}</span>
                  )}
                  {item.bt_facilities.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] font-semibold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setModal(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> {t.adminTipeBusPage.edit}
                  </button>
                  <button
                    onClick={() => handleHapus(item)}
                    disabled={actionLoading === item.bus_type_id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/5 disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t.adminTipeBusPage.hapus}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalHalaman > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={halamanSekarang <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminTipeBusPage.sebelumnya}
              </button>
              <span className="text-xs text-gray-400">
                {t.adminTipeBusPage.halamanInfo.replace('{halaman}', halamanSekarang).replace('{total}', totalHalaman)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {t.adminTipeBusPage.selanjutnya} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {modal === 'tambah' && (
        <TipeBusForm
          t={t}
          options={options}
          initial={null}
          onCancel={() => setModal(null)}
          onSubmit={handleTambah}
          submitting={submitting}
        />
      )}

      {modal && modal !== 'tambah' && (
        <TipeBusForm
          t={t}
          options={options}
          initial={modal}
          onCancel={() => setModal(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}
    </div>
  )
}