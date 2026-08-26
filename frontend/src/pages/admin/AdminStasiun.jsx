import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, Search, MapPin } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminStasiun() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [cariAktif, setCariAktif] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice || '')

  const muatData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getAdminStation({ cari: cariAktif || undefined, page })
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

  // Bersihkan notice dari state navigasi supaya tidak muncul lagi kalau
  // halaman ini di-refresh atau dikunjungi ulang lewat tombol back.
  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCariSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setCariAktif(cari)
  }

  const handleHapus = async (item) => {
    if (!window.confirm(t.adminStasiunPage.konfirmasiHapus)) return
    setActionLoading(item.station_id)
    setError('')
    try {
      await api.hapusStation(item.station_id)
      setNotice(t.adminStasiunPage.berhasilHapus)
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
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminStasiunPage.judul}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminStasiunPage.subJudul}</p>
        </div>
        <Link
          to="/admin/terminal/tambah"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.adminStasiunPage.tambahTerminal}
        </Link>
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
          placeholder={t.adminStasiunPage.cariPlaceholder}
          className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
      </form>

      {loading && <p className="text-sm text-gray-400 text-center py-10">{t.adminStasiunPage.memuat}</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{error}</p>
          <button
            onClick={muatData}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminStasiunPage.muatUlang}
          </button>
        </div>
      )}

      {!loading && !error && daftar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">
          {cariAktif ? t.adminStasiunPage.tidakDitemukan : t.adminStasiunPage.kosong}
        </p>
      )}

      {!loading && !error && daftar.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftar.map((item) => (
              <div key={item.station_id} className="card">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-navy-900 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy-900 truncate">{item.stn_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.kota}{item.provinsi ? `, ${item.provinsi}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4 min-h-[1.5rem]">
                  {item.stn_address || t.adminStasiunPage.tanpaAlamat}
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/admin/terminal/edit/${item.station_id}`}
                    state={{ item }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> {t.adminStasiunPage.edit}
                  </Link>
                  <button
                    onClick={() => handleHapus(item)}
                    disabled={actionLoading === item.station_id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/5 disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t.adminStasiunPage.hapus}
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
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminStasiunPage.sebelumnya}
              </button>
              <span className="text-xs text-gray-400">
                {t.adminStasiunPage.halamanInfo.replace('{halaman}', halamanSekarang).replace('{total}', totalHalaman)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {t.adminStasiunPage.selanjutnya} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
