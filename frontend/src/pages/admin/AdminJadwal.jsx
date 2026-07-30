import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Power, RefreshCcw, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function JadwalForm({ t, options, initial, onCancel, onSubmit, submitting }) {
  const [routeId, setRouteId] = useState(initial?.route_id || '')
  const [busTypeId, setBusTypeId] = useState(initial?.bus_type_id || '')
  const [tanggal, setTanggal] = useState(initial?.av_date || '')
  const [jam, setJam] = useState(initial?.av_time || '')
  const [hargaDewasa, setHargaDewasa] = useState(initial?.av_price?.adult ?? '')
  const [hargaAnak, setHargaAnak] = useState(initial?.av_price?.child ?? '')
  const isEdit = Boolean(initial)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      route_id: routeId,
      bus_type_id: busTypeId,
      av_date: tanggal,
      av_time: jam,
      av_price: { adult: Number(hargaDewasa), child: Number(hargaAnak) },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-navy-900 text-lg">
            {isEdit ? t.adminJadwalPage.formEditJudul : t.adminJadwalPage.formTambahJudul}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={onCancel}
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
      </div>
    </div>
  )
}

export default function AdminJadwal() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [options, setOptions] = useState({ routes: [], bus_types: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [modal, setModal] = useState(null) // null | 'tambah' | availability object (edit)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  const muatJadwal = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getAdminJadwal({ tanggal: tanggal || undefined, page })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tanggal, page])

  useEffect(() => {
    muatJadwal()
  }, [muatJadwal])

  useEffect(() => {
    api.getAdminJadwalOptions().then(setOptions).catch(() => {})
  }, [])

  const handleToggleStatus = async (item) => {
    setActionLoading(item.availability_id)
    try {
      if (item.av_status === 'active') {
        await api.nonaktifkanJadwal(item.availability_id)
      } else {
        await api.ubahJadwal(item.availability_id, { av_status: 'active' })
      }
      await muatJadwal()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTambah = async (payload) => {
    setSubmitting(true)
    try {
      await api.tambahJadwal(payload)
      setModal(null)
      setNotice(t.adminJadwalPage.berhasilTambah)
      setPage(1)
      await muatJadwal()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    setSubmitting(true)
    try {
      await api.ubahJadwal(modal.availability_id, {
        av_time: payload.av_time,
        av_price: payload.av_price,
      })
      setModal(null)
      setNotice(t.adminJadwalPage.berhasilUbah)
      await muatJadwal()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const daftar = data?.data || []
  const halamanSekarang = data?.current_page || 1
  const totalHalaman = data?.last_page || 1

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminJadwalPage.judul}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminJadwalPage.subJudul}</p>
        </div>
        <button
          onClick={() => setModal('tambah')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.adminJadwalPage.tambahJadwal}
        </button>
      </div>

      {notice && (
        <div className="text-sm text-brand-teal bg-brand-teal/10 border border-brand-teal/20 rounded-lg px-4 py-2.5 mb-5">
          {notice}
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <label className="text-xs font-semibold text-gray-500">{t.adminJadwalPage.filterTanggal}</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => {
            setTanggal(e.target.value)
            setPage(1)
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
        {tanggal && (
          <button
            onClick={() => setTanggal('')}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-10">{t.adminJadwalPage.memuat}</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{t.adminJadwalPage.gagalMuat}</p>
          <button
            onClick={muatJadwal}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminJadwalPage.muatUlang}
          </button>
        </div>
      )}

      {!loading && !error && daftar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">{t.adminJadwalPage.kosong}</p>
      )}

      {!loading && !error && daftar.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2.5 pr-4 font-semibold">{t.adminJadwalPage.kolomRute}</th>
                  <th className="py-2.5 pr-4 font-semibold">{t.adminJadwalPage.kolomTanggalJam}</th>
                  <th className="py-2.5 pr-4 font-semibold">{t.adminJadwalPage.kolomTipeBus}</th>
                  <th className="py-2.5 pr-4 font-semibold">{t.adminJadwalPage.kolomHarga}</th>
                  <th className="py-2.5 pr-4 font-semibold">{t.adminJadwalPage.kolomStatus}</th>
                  <th className="py-2.5 pr-0 font-semibold text-right">{t.adminJadwalPage.kolomAksi}</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((item) => (
                  <tr key={item.availability_id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 font-medium text-navy-900">
                        <span>{item.terminal_asal}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{item.terminal_tujuan}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {item.kota_asal} → {item.kota_tujuan}
                      </p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <p className="text-navy-900">{item.av_date}</p>
                      <p className="text-xs text-gray-400">{item.av_time}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <p className="text-navy-900">{item.bt_name}</p>
                      <p className="text-xs text-gray-400">{item.operator}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <p className="text-navy-900">Rp {Number(item.av_price?.adult || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-400">
                        Rp {Number(item.av_price?.child || 0).toLocaleString('id-ID')} ({t.adminJadwalPage.labelHargaAnak.split(' ')[0]})
                      </p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          item.av_status === 'active'
                            ? 'bg-brand-teal/10 text-brand-teal'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.av_status === 'active' ? t.adminJadwalPage.statusAktif : t.adminJadwalPage.statusNonaktif}
                      </span>
                    </td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setModal(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> {t.adminJadwalPage.edit}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={actionLoading === item.availability_id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/5 disabled:opacity-50"
                        >
                          <Power className="w-3.5 h-3.5" />{' '}
                          {item.av_status === 'active' ? t.adminJadwalPage.nonaktifkan : t.adminJadwalPage.aktifkan}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalHalaman > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={halamanSekarang <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminJadwalPage.sebelumnya}
              </button>
              <span className="text-xs text-gray-400">
                {t.adminJadwalPage.halamanInfo.replace('{halaman}', halamanSekarang).replace('{total}', totalHalaman)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {t.adminJadwalPage.selanjutnya} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {modal === 'tambah' && (
        <JadwalForm
          t={t}
          options={options}
          initial={null}
          onCancel={() => setModal(null)}
          onSubmit={handleTambah}
          submitting={submitting}
        />
      )}

      {modal && modal !== 'tambah' && (
        <JadwalForm
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
