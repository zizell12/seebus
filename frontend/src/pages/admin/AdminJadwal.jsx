import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Power,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

// Dropdown pencarian sederhana: ketik untuk memfilter opsi, klik salah satu
// untuk memilih. Dipakai untuk filter Rute & Tipe Bus supaya gampang dicari
// walau daftarnya panjang.
function SearchCombo({ value, onChange, options, placeholder, emptyText }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={open ? query : selected?.label || ''}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20 bg-white"
      />
      {value && !open && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            setQuery('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
          >
            {placeholder}
          </button>
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">{emptyText}</p>}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(String(o.value))
                setQuery(o.label)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                String(o.value) === String(value) ? 'text-navy-900 font-semibold bg-gray-50' : 'text-gray-600'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Bikin daftar nomor halaman dengan tanda "..." kalau rentangnya panjang,
// mis. [1, '...', 4, 5, 6, '...', 139]
function getPageNumbers(current, total) {
  const delta = 1
  const range = []
  const withDots = []
  let last

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (last) {
      if (i - last === 2) {
        withDots.push(last + 1)
      } else if (i - last !== 1) {
        withDots.push('...')
      }
    }
    withDots.push(i)
    last = i
  })

  return withDots
}

export default function AdminJadwal() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [routeId, setRouteId] = useState('')
  const [busTypeId, setBusTypeId] = useState('')
  const [status, setStatus] = useState('')
  const [options, setOptions] = useState({ routes: [], bus_types: [] })
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice || '')

  useEffect(() => {
    api.getAdminJadwalOptions().then(setOptions).catch(() => {})
  }, [])

  const muatJadwal = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getAdminJadwal({
        tanggal: tanggal || undefined,
        routeId: routeId || undefined,
        busTypeId: busTypeId || undefined,
        status: status || undefined,
        page,
      })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tanggal, routeId, busTypeId, status, page])

  useEffect(() => {
    muatJadwal()
  }, [muatJadwal])

  const adaFilterAktif = tanggal || routeId || busTypeId || status
  const jumlahFilterAktif = [tanggal, routeId, busTypeId, status].filter(Boolean).length

  const resetFilter = () => {
    setTanggal('')
    setRouteId('')
    setBusTypeId('')
    setStatus('')
    setPage(1)
  }

  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold border px-4 py-2.5 rounded-lg transition-colors ${
              filterOpen
                ? 'bg-navy-900 text-white border-navy-900'
                : 'text-navy-900 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> {t.adminJadwalPage.filter}
            {jumlahFilterAktif > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-brand-red text-white rounded-full">
                {jumlahFilterAktif}
              </span>
            )}
          </button>
          <Link
            to="/admin/jadwal/generate"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminJadwalPage.generateBerulang}
          </Link>
          <Link
            to="/admin/jadwal/tambah"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t.adminJadwalPage.tambahJadwal}
          </Link>
        </div>
      </div>

      {notice && (
        <div className="text-sm text-brand-teal bg-brand-teal/10 border border-brand-teal/20 rounded-lg px-4 py-2.5 mb-5">
          {notice}
        </div>
      )}

      {filterOpen && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {t.adminJadwalPage.filterRute}
              </label>
              <SearchCombo
                value={routeId}
                onChange={(v) => {
                  setRouteId(v)
                  setPage(1)
                }}
                options={options.routes.map((r) => ({ value: r.route_id, label: r.label }))}
                placeholder={t.adminJadwalPage.semuaRute}
                emptyText={t.adminJadwalPage.tidakAdaHasil}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {t.adminJadwalPage.filterTipeBus}
              </label>
              <SearchCombo
                value={busTypeId}
                onChange={(v) => {
                  setBusTypeId(v)
                  setPage(1)
                }}
                options={options.bus_types.map((bt) => ({ value: bt.bus_type_id, label: bt.label }))}
                placeholder={t.adminJadwalPage.semuaTipeBus}
                emptyText={t.adminJadwalPage.tidakAdaHasil}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {t.adminJadwalPage.filterTanggal}
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value)
                  setPage(1)
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {t.adminJadwalPage.filterStatus}
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20 bg-white"
              >
                <option value="">{t.adminJadwalPage.semuaStatus}</option>
                <option value="active">{t.adminJadwalPage.statusAktif}</option>
                <option value="inactive">{t.adminJadwalPage.statusNonaktif}</option>
              </select>
            </div>
          </div>

          {adaFilterAktif && (
            <button
              onClick={resetFilter}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-red mt-3"
            >
              <X className="w-3.5 h-3.5" /> {t.adminJadwalPage.resetFilter}
            </button>
          )}
        </div>
      )}

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
                        <Link
                          to={`/admin/jadwal/edit/${item.availability_id}`}
                          state={{ item }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> {t.adminJadwalPage.edit}
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={actionLoading === item.availability_id}
                          className={`inline-flex items-center gap-1 text-xs font-semibold border px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors ${
                            item.av_status === 'active'
                              ? 'text-brand-red border-brand-red/20 hover:bg-brand-red/5'
                              : 'text-brand-teal border-brand-teal/20 hover:bg-brand-teal/5'
                          }`}
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
            <div className="flex items-center justify-center flex-wrap gap-1.5 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={halamanSekarang <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminJadwalPage.sebelumnya}
              </button>

              {getPageNumbers(halamanSekarang, totalHalaman).map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1.5 text-xs text-gray-400 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[2rem] h-8 px-2 flex items-center justify-center text-xs font-semibold rounded-lg border transition-colors ${
                      p === halamanSekarang
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'text-navy-900 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

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
    </div>
  )
}
