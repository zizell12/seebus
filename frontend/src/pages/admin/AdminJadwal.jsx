import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Power, RefreshCcw, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminJadwal() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice || '')

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
        <Link
          to="/admin/jadwal/tambah"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.adminJadwalPage.tambahJadwal}
        </Link>
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
    </div>
  )
}
