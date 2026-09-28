import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, Search, Bus, Power, Building2 } from 'lucide-react'
import { api } from '../../utils/api'

export default function AdminArmada() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const busTypeIdFilter = searchParams.get('bus_type_id') || ''

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
      const res = await api.getAdminBusUnit({ cari: cariAktif || undefined, page, busTypeId: busTypeIdFilter || undefined })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cariAktif, page, busTypeIdFilter])

  useEffect(() => {
    muatData()
  }, [muatData])

  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCariSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setCariAktif(cari)
  }

  const handleHapus = async (item) => {
    if (!window.confirm(`Hapus armada "${item.bu_code}"?`)) return
    setActionLoading(item.bus_unit_id)
    setError('')
    try {
      await api.hapusBusUnit(item.bus_unit_id)
      setNotice('Armada berhasil dihapus.')
      await muatData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (item) => {
    setActionLoading(item.bus_unit_id)
    setError('')
    try {
      const res = await api.toggleBusUnitStatus(item.bus_unit_id)
      setNotice(res.message)
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
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">Kelola Armada</h1>
          <p className="text-sm text-gray-500 mt-1">Atur unit bus fisik, plat nomor, kapasitas, dan fasilitasnya.</p>
        </div>
        <Link
          to="/admin/armada/tambah"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Armada
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
          placeholder="Cari kode unit, plat nomor, atau kelas..."
          className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
      </form>

      {loading && <p className="text-sm text-gray-400 text-center py-10">Memuat armada...</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{error}</p>
          <button
            onClick={muatData}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> Muat Ulang
          </button>
        </div>
      )}

      {!loading && !error && daftar.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">
          {cariAktif ? 'Tidak ada armada yang cocok.' : 'Belum ada armada. Tambah kelas bus dulu di menu Tipe Bus kalau belum ada.'}
        </p>
      )}

      {!loading && !error && daftar.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftar.map((item) => (
              <div key={item.bus_unit_id} className={`card ${!item.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy-900 truncate flex items-center gap-1.5">
                      <Bus className="w-4 h-4 shrink-0" /> {item.bu_code}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" /> {item.perusahaan} - {item.kelas}
                    </p>
                    {item.bu_plate_number && <p className="text-xs text-gray-400 mt-0.5">{item.bu_plate_number}</p>}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      item.is_active ? 'text-brand-teal bg-brand-teal/10' : 'text-gray-500 bg-gray-100'
                    }`}
                  >
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>
                    Kapasitas: <b className="text-navy-900">{item.bu_capacity} kursi</b>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
                  {item.bu_facilities.length === 0 && <span className="text-xs text-gray-400">Belum ada fasilitas</span>}
                  {item.bu_facilities.map((f) => (
                    <span key={f} className="text-[11px] font-semibold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/admin/armada/edit/${item.bus_unit_id}`}
                    state={{ item }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    disabled={actionLoading === item.bus_unit_id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Power className="w-3.5 h-3.5" /> {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => handleHapus(item)}
                    disabled={actionLoading === item.bus_unit_id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/5 disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
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
                <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
              </button>
              <span className="text-xs text-gray-400">
                Halaman {halamanSekarang} dari {totalHalaman}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
