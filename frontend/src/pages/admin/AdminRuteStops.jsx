import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Plus, Trash2, Pencil, X, Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { api } from '../../utils/api'

const STOP_TYPE_LABEL = {
  pickup: 'Naik saja',
  dropoff: 'Turun saja',
  both: 'Naik & turun',
}

const FORM_KOSONG = {
  station_id: '',
  stop_type: 'both',
  offset_minutes: '',
  fare_adult: '',
  fare_child: '',
  fare_infant: '',
}

function formatRupiah(angka) {
  if (angka === null || angka === undefined || angka === '') return '-'
  return `Rp${Number(angka).toLocaleString('id-ID')}`
}

export default function AdminRuteStops() {
  const { id: routeId } = useParams()
  const location = useLocation()
  const rutePreview = location.state?.item || null

  const [stops, setStops] = useState([])
  const [sudahPunyaJadwal, setSudahPunyaJadwal] = useState(false)
  const [options, setOptions] = useState({ stations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState(FORM_KOSONG)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(FORM_KOSONG)

  const muatData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [resStops, resOptions] = await Promise.all([api.getRouteStops(routeId), api.getAdminRouteOptions()])
      setStops(resStops.data || [])
      setSudahPunyaJadwal(Boolean(resStops.sudah_punya_jadwal))
      setOptions(resOptions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => {
    muatData()
  }, [muatData])

  const titikBerikutnyaAdalahPertama = stops.length === 0

  const handleTambah = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        station_id: Number(form.station_id),
        stop_type: form.stop_type,
        offset_minutes: form.offset_minutes === '' ? null : Number(form.offset_minutes),
        ...(titikBerikutnyaAdalahPertama
          ? {}
          : {
              fare_adult: Number(form.fare_adult),
              fare_child: Number(form.fare_child),
              fare_infant: Number(form.fare_infant),
            }),
      }
      await api.tambahRouteStop(routeId, payload)
      setForm(FORM_KOSONG)
      setNotice('Titik pemberhentian berhasil ditambahkan.')
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const mulaiEdit = (stop) => {
    setEditingId(stop.route_stop_id)
    setEditForm({
      station_id: stop.station_id,
      stop_type: stop.stop_type,
      offset_minutes: stop.offset_minutes ?? '',
      fare_adult: stop.fare_adult ?? '',
      fare_child: stop.fare_child ?? '',
      fare_infant: stop.fare_infant ?? '',
    })
  }

  const batalEdit = () => {
    setEditingId(null)
    setEditForm(FORM_KOSONG)
  }

  const simpanEdit = async (stop) => {
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        station_id: Number(editForm.station_id),
        stop_type: editForm.stop_type,
        offset_minutes: editForm.offset_minutes === '' ? null : Number(editForm.offset_minutes),
        ...(stop.stop_order === 0
          ? {}
          : {
              fare_adult: Number(editForm.fare_adult),
              fare_child: Number(editForm.fare_child),
              fare_infant: Number(editForm.fare_infant),
            }),
      }
      await api.ubahRouteStop(routeId, stop.route_stop_id, payload)
      setNotice('Titik pemberhentian berhasil diperbarui.')
      batalEdit()
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleHapus = async (stop) => {
    if (!window.confirm(`Hapus titik "${stop.nama_terminal}"?`)) return
    setError('')
    setSubmitting(true)
    try {
      await api.hapusRouteStop(routeId, stop.route_stop_id)
      setNotice('Titik pemberhentian berhasil dihapus.')
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const stopTerakhirId = stops.length ? stops[stops.length - 1].route_stop_id : null

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">Titik Pemberhentian</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rutePreview ? (
              <span className="inline-flex items-center gap-1.5">
                {rutePreview.terminal_asal} <ArrowRight className="w-3.5 h-3.5" /> {rutePreview.terminal_tujuan}
              </span>
            ) : (
              'Atur urutan titik naik/turun beserta harga per etape untuk rute ini.'
            )}
          </p>
        </div>
        <Link
          to="/admin/rute"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>

      {notice && (
        <div className="text-sm text-brand-teal bg-brand-teal/10 border border-brand-teal/20 rounded-lg px-4 py-2.5 mb-5">
          {notice}
        </div>
      )}
      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      {sudahPunyaJadwal && (
        <div className="flex items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Rute ini sudah punya jadwal aktif, jadi daftar titik pemberhentiannya dikunci (tidak bisa
            ditambah/diedit/dihapus). Kalau perlu revisi besar pada urutan titik atau harga, buat rute baru saja
            supaya jadwal & booking yang sudah ada tidak jadi tidak konsisten.
          </p>
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-10">Memuat data...</p>}

      {!loading && (
        <div className="space-y-3">
          {stops.map((stop, index) => {
            const isEditing = editingId === stop.route_stop_id
            const isTerakhir = stop.route_stop_id === stopTerakhirId

            return (
              <div key={stop.route_stop_id} className="card">
                {!isEditing ? (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin className="w-4 h-4 text-navy-900 shrink-0" />
                        <span className="font-bold text-navy-900">{stop.nama_terminal}</span>
                        <span className="text-xs text-gray-400">({stop.kota})</span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {STOP_TYPE_LABEL[stop.stop_type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        {stop.offset_minutes ? <span>+{stop.offset_minutes} menit dari titik awal</span> : null}
                        {stop.stop_order === 0 ? (
                          <span className="text-gray-400">Titik keberangkatan awal, tanpa etape harga</span>
                        ) : (
                          <span>
                            Etape ini: <b className="text-navy-900">{formatRupiah(stop.fare_adult)}</b> dewasa ·{' '}
                            <b className="text-navy-900">{formatRupiah(stop.fare_child)}</b> anak ·{' '}
                            <b className="text-navy-900">{formatRupiah(stop.fare_infant)}</b> bayi
                          </span>
                        )}
                      </div>
                    </div>
                    {!sudahPunyaJadwal && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => mulaiEdit(stop)}
                          className="p-2 rounded-lg text-navy-900 border border-gray-200 hover:bg-gray-50"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isTerakhir && (
                          <button
                            onClick={() => handleHapus(stop)}
                            disabled={submitting}
                            className="p-2 rounded-lg text-brand-red border border-brand-red/20 hover:bg-brand-red/5 disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Terminal</label>
                        <select
                          value={editForm.station_id}
                          onChange={(e) => setEditForm((f) => ({ ...f, station_id: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                        >
                          {options.stations.map((s) => (
                            <option key={s.station_id} value={s.station_id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipe</label>
                        <select
                          value={editForm.stop_type}
                          onChange={(e) => setEditForm((f) => ({ ...f, stop_type: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                        >
                          <option value="both">Naik & turun</option>
                          <option value="pickup">Naik saja</option>
                          <option value="dropoff">Turun saja</option>
                        </select>
                      </div>
                    </div>

                    {stop.stop_order > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga dewasa</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.fare_adult}
                            onChange={(e) => setEditForm((f) => ({ ...f, fare_adult: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga anak</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.fare_child}
                            onChange={(e) => setEditForm((f) => ({ ...f, fare_child: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga bayi</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.fare_infant}
                            onChange={(e) => setEditForm((f) => ({ ...f, fare_infant: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={batalEdit}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-50"
                      >
                        <X className="w-3.5 h-3.5" /> Batal
                      </button>
                      <button
                        onClick={() => simpanEdit(stop)}
                        disabled={submitting}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand-red px-3 py-2 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Simpan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {stops.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              Belum ada titik pemberhentian. Tambahkan titik keberangkatan paling awal dulu di bawah ini.
            </p>
          )}
        </div>
      )}

      {!loading && !sudahPunyaJadwal && (
        <form onSubmit={handleTambah} className="card mt-5 space-y-3">
          <p className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            {titikBerikutnyaAdalahPertama ? 'Tambah titik keberangkatan awal' : 'Tambah titik berikutnya'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Terminal</label>
              <select
                required
                value={form.station_id}
                onChange={(e) => setForm((f) => ({ ...f, station_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              >
                <option value="">Pilih terminal</option>
                {options.stations.map((s) => (
                  <option key={s.station_id} value={s.station_id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipe</label>
              <select
                value={form.stop_type}
                onChange={(e) => setForm((f) => ({ ...f, stop_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              >
                <option value="both">Naik & turun</option>
                <option value="pickup">Naik saja</option>
                <option value="dropoff">Turun saja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Estimasi menit dari titik awal (opsional)
            </label>
            <input
              type="number"
              min="0"
              value={form.offset_minutes}
              onChange={(e) => setForm((f) => ({ ...f, offset_minutes: e.target.value }))}
              placeholder="mis. 90"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          {!titikBerikutnyaAdalahPertama && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga dewasa (etape ini)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.fare_adult}
                  onChange={(e) => setForm((f) => ({ ...f, fare_adult: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga anak (etape ini)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.fare_child}
                  onChange={(e) => setForm((f) => ({ ...f, fare_child: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga bayi (etape ini)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.fare_infant}
                  onChange={(e) => setForm((f) => ({ ...f, fare_infant: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Tambah Titik'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
