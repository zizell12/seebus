import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, X, Search, ArrowRight, Route as RouteIcon, Clock } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function formatDurasi(t, menit) {
  if (!menit && menit !== 0) return t.adminRutePage.tanpaDurasi
  const jam = Math.floor(menit / 60)
  const sisaMenit = menit % 60
  if (jam > 0) {
    return t.adminRutePage.jamMenitFormat.replace('{jam}', jam).replace('{menit}', sisaMenit)
  }
  return t.adminRutePage.menitFormat.replace('{menit}', sisaMenit)
}

function RuteForm({ t, options, initial, onCancel, onSubmit, submitting }) {
  const [originId, setOriginId] = useState(initial?.origin_station_id || '')
  const [destinationId, setDestinationId] = useState(initial?.destination_station_id || '')
  const [jarak, setJarak] = useState(initial?.rt_distance_km ?? '')
  const [durasi, setDurasi] = useState(initial?.rt_duration_min ?? '')
  const [errorLokal, setErrorLokal] = useState('')
  const isEdit = Boolean(initial)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (originId && destinationId && String(originId) === String(destinationId)) {
      setErrorLokal(t.adminRutePage.validasiAsalTujuanSama)
      return
    }
    setErrorLokal('')
    onSubmit({
      origin_station_id: Number(originId),
      destination_station_id: Number(destinationId),
      rt_distance_km: jarak === '' ? null : Number(jarak),
      rt_duration_min: durasi === '' ? null : Number(durasi),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-navy-900 text-lg">
            {isEdit ? t.adminRutePage.formEditJudul : t.adminRutePage.formTambahJudul}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorLokal && <p className="text-sm text-brand-red mb-3">{errorLokal}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={onCancel}
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
      </div>
    </div>
  )
}

export default function AdminRute() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [options, setOptions] = useState({ stations: [] })
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
      const res = await api.getAdminRoute({ cari: cariAktif || undefined, page })
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
    api.getAdminRouteOptions().then(setOptions).catch(() => {})
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
      await api.tambahRoute(payload)
      setModal(null)
      setNotice(t.adminRutePage.berhasilTambah)
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
      await api.ubahRoute(modal.route_id, payload)
      setModal(null)
      setNotice(t.adminRutePage.berhasilUbah)
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleHapus = async (item) => {
    if (!window.confirm(t.adminRutePage.konfirmasiHapus)) return
    setActionLoading(item.route_id)
    setError('')
    try {
      await api.hapusRoute(item.route_id)
      setNotice(t.adminRutePage.berhasilHapus)
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
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminRutePage.judul}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminRutePage.subJudul}</p>
        </div>
        <button
          onClick={() => setModal('tambah')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.adminRutePage.tambahRute}
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
          placeholder={t.adminRutePage.cariPlaceholder}
          className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
      </form>

      {loading && <p className="text-sm text-gray-400 text-center py-10">{t.adminRutePage.memuat}</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{error}</p>
          <button
            onClick={muatData}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminRutePage.muatUlang}
          </button>
        </div>
      )}

      {!loading && !error && daftar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">
          {cariAktif ? t.adminRutePage.tidakDitemukan : t.adminRutePage.kosong}
        </p>
      )}

      {!loading && !error && daftar.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftar.map((item) => (
              <div key={item.route_id} className="card">
                <div className="flex items-start gap-2 mb-3">
                  <RouteIcon className="w-4 h-4 text-navy-900 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap font-bold text-navy-900">
                      <span className="truncate">{item.terminal_asal}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{item.terminal_tujuan}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.kota_asal} → {item.kota_tujuan}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>
                    {t.adminRutePage.kolomJarak}:{' '}
                    <span className="font-semibold text-navy-900">
                      {item.rt_distance_km !== null ? `${item.rt_distance_km} km` : t.adminRutePage.tanpaJarak}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-semibold text-navy-900">{formatDurasi(t, item.rt_duration_min)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setModal(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> {t.adminRutePage.edit}
                  </button>
                  <button
                    onClick={() => handleHapus(item)}
                    disabled={actionLoading === item.route_id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/5 disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t.adminRutePage.hapus}
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
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminRutePage.sebelumnya}
              </button>
              <span className="text-xs text-gray-400">
                {t.adminRutePage.halamanInfo.replace('{halaman}', halamanSekarang).replace('{total}', totalHalaman)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {t.adminRutePage.selanjutnya} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {modal === 'tambah' && (
        <RuteForm
          t={t}
          options={options}
          initial={null}
          onCancel={() => setModal(null)}
          onSubmit={handleTambah}
          submitting={submitting}
        />
      )}

      {modal && modal !== 'tambah' && (
        <RuteForm
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
