import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, XCircle } from 'lucide-react'
import { api } from '../../utils/api'

const STATUS_LABEL = {
  paid: 'Berbayar',
  pending: 'Menunggu',
  cancelled: 'Dibatalkan',
  expired: 'Expired',
}

function rupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`
}

function usdLabel(value) {
  return value == null ? '' : ` · $${Number(value).toFixed(2)} USD`
}

export default function AdminBooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [cari, setCari] = useState('')
  const [cariAktif, setCariAktif] = useState('')
  const [mode, setMode] = useState('kebijakan')
  const [reason, setReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getAdminBooking({ status: status || undefined, q: cariAktif || undefined, page })
      setList(response.data || [])
      setPagination({
        currentPage: response.current_page || 1,
        lastPage: response.last_page || 1,
        total: response.total || 0,
      })
      if (id) {
        const detail = await api.getAdminBookingDetail(id)
        setData(detail.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cariAktif, id, page, status])

  useEffect(() => {
    loadList()
  }, [loadList])

  const booking = data || null

  const handleCari = (event) => {
    event.preventDefault()
    setPage(1)
    setCariAktif(cari)
  }

  const handleCancel = async (event) => {
    event.preventDefault()
    if (!booking || !reason.trim()) return
    setCancelLoading(true)
    setError('')
    try {
      await api.cancelAdminBooking(booking.booking_id, {
        reason: reason.trim(),
        refund_mode: mode,
      })
      setConfirmingCancel(false)
      await loadList()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  if (id) {
    if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-400">Memuat booking...</div>
    if (!booking) return <div className="max-w-5xl mx-auto px-4 py-10 text-brand-red">{error || 'Booking tidak ditemukan.'}</div>

    const refund = booking.pratinjau_refund
    const canCancel = booking.bisa_dibatalkan
    const selectedRefund = refund?.[mode] || { persen: 0, jumlah: 0, jumlah_usd: null }

    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <button onClick={() => navigate('/admin/booking')} className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
        </button>
        <div className="card p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Booking #{booking.booking_id}</p>
              <h1 className="text-2xl font-bold text-navy-900">{booking.bk_code}</h1>
              <p className="text-sm text-gray-500">Status: {STATUS_LABEL[booking.bk_status] || booking.bk_status}</p>
            </div>
            <span className="rounded-full bg-navy-900/5 px-3 py-1 text-xs font-semibold text-navy-900">{booking.penumpang.length} penumpang</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="font-bold text-navy-900 mb-3">Jadwal & rute</h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-4"><dt className="text-gray-500">Asal</dt><dd className="font-medium text-navy-900">{booking.jadwal?.dari || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-gray-500">Tujuan</dt><dd className="font-medium text-navy-900">{booking.jadwal?.tujuan || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-gray-500">Tanggal</dt><dd className="font-medium text-navy-900">{booking.jadwal?.tanggal || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-gray-500">Jam</dt><dd className="font-medium text-navy-900">{booking.jadwal?.jam || '-'}</dd></div>
              </dl>
            </div>
            <div>
              <h2 className="font-bold text-navy-900 mb-3">Penumpang</h2>
              <div className="space-y-3">
                {booking.penumpang.map((passenger, index) => (
                  <div key={`${passenger.ps_name}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-navy-900">{passenger.ps_name} · {passenger.ps_category}</p>
                    <p className="text-xs text-gray-500">
                      {passenger.ps_seat_number ? `Kursi ${passenger.ps_seat_number} · ` : ''}{passenger.naik_dari} → {passenger.turun_di}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {booking.bk_status === 'cancelled' && booking.pembatalan && (
            <section className="mt-8 rounded-lg border border-brand-red/20 bg-brand-red/5 p-4">
              <h2 className="font-bold text-navy-900 mb-3">Hasil pembatalan</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Refund</dt><dd className="font-semibold text-navy-900">{booking.pembatalan.refund_persen === null ? 'Belum dibayar, tidak ada refund' : <>{booking.pembatalan.refund_persen}% · {rupiah(booking.pembatalan.refund_jumlah)}{usdLabel(booking.pembatalan.refund_usd)}</>}</dd></div>
                <div><dt className="text-gray-500">ID refund</dt><dd className="font-semibold text-navy-900">{booking.pembatalan.refund_id || '—'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-gray-500">Alasan</dt><dd className="font-semibold text-navy-900">{booking.pembatalan.alasan || '—'}</dd></div>
              </dl>
            </section>
          )}

          {canCancel && (
            <form onSubmit={handleCancel} onChange={() => setConfirmingCancel(false)} className="mt-8 border-t border-gray-200 pt-7">
              <h2 className="font-bold text-navy-900 mb-4">Batalkan booking</h2>
              {error && <p className="mb-4 rounded-lg border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">{error}</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-600">
                  Alasan
                  <input value={reason} onChange={(e) => setReason(e.target.value)} minLength="5" maxLength="255" required placeholder="Contoh: Pelanggan mengajukan pembatalan" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-navy-900/20" />
                </label>
                <label className="text-sm text-gray-600">
                  Mode refund
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-navy-900/20">
                    <option value="kebijakan">Kebijakan 75% / 0%</option>
                    <option value="penuh">Penuh 100%</option>
                  </select>
                </label>
              </div>
              {refund && (
                <div className="grid gap-3 mt-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-brand-red/5 p-3"><p className="text-xs text-gray-500">Refund kebijakan</p><p className="font-bold text-navy-900">{rupiah(refund.kebijakan.jumlah)}{usdLabel(refund.kebijakan.jumlah_usd)}</p></div>
                  <div className="rounded-lg bg-brand-teal/5 p-3"><p className="text-xs text-gray-500">Refund penuh</p><p className="font-bold text-navy-900">{rupiah(refund.penuh.jumlah)}{usdLabel(refund.penuh.jumlah_usd)}</p></div>
                </div>
              )}
              {confirmingCancel && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p>Konfirmasi pembatalan: refund <strong>{selectedRefund.persen}%</strong>, sebesar <strong>{rupiah(selectedRefund.jumlah)}{usdLabel(selectedRefund.jumlah_usd)}</strong>. Lanjutkan?</p>
                  <div className="mt-3 flex gap-2">
                    <button type="submit" disabled={cancelLoading} className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red/90 disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> {cancelLoading ? 'Memproses...' : 'Ya, batalkan booking'}
                    </button>
                    <button type="button" onClick={() => setConfirmingCancel(false)} disabled={cancelLoading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50">Kembali</button>
                  </div>
                </div>
              )}
              {!confirmingCancel && (
                <button type="button" disabled={cancelLoading || reason.trim().length < 5} onClick={() => { setError(''); setConfirmingCancel(true) }} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red/90 disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Tinjau pembatalan
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-navy-900">Booking & Refund</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar, detail, dan pembatalan booking admin.</p>
      </div>

      <form onSubmit={handleCari} className="relative max-w-sm mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari kode booking / pelanggan..." className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20" />
      </form>
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'paid', 'pending', 'cancelled', 'expired'].map((item) => (
          <button key={item} onClick={() => { setPage(1); setStatus(item) }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === item ? 'bg-navy-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {item ? STATUS_LABEL[item] : 'Semua'}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-brand-red/5 px-4 py-3 text-sm text-brand-red">{error}</p>}
      {loading && <p className="text-center py-10 text-gray-400">Memuat booking...</p>}
      {!loading && list.length === 0 && <p className="text-center py-10 text-gray-400">Belum ada booking.</p>}
      {!loading && list.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400"><th className="px-4 py-3 font-semibold">Kode</th><th className="px-4 py-3 font-semibold">Pelanggan</th><th className="px-4 py-3 font-semibold">Jadwal</th><th className="px-4 py-3 font-semibold">Total / refund</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Detail</th></tr></thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.booking_id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold text-navy-900">{item.bk_code}</td>
                  <td className="px-4 py-3 text-gray-600"><p>{item.nama || item.contact?.ct_name || '-'}</p><p className="text-xs text-gray-400">{item.email || item.contact?.ct_email || ''}</p></td>
                  <td className="px-4 py-3 text-gray-600"><p>{item.tanggal || '-'}</p><p className="text-xs text-gray-400">{item.jam_berangkat || ''}</p></td>
                  <td className="px-4 py-3 text-gray-600"><p>{rupiah(item.bk_total_price)}</p>{item.bk_status === 'cancelled' && <p className="text-xs text-gray-400">Refund {rupiah(item.bk_refund_amount)}</p>}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.bk_status === 'paid' ? 'bg-brand-teal/10 text-brand-teal' : item.bk_status === 'cancelled' ? 'bg-brand-red/10 text-brand-red' : 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[item.bk_status] || item.bk_status}</span></td>
                  <td className="px-4 py-3"><Link to={`/admin/booking/${item.booking_id}`} className="text-xs font-semibold text-navy-900 hover:underline">Lihat detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>{pagination.total} booking · Halaman {pagination.currentPage} dari {pagination.lastPage} (20 per halaman)</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">Sebelumnya</button>
            <button type="button" disabled={page >= pagination.lastPage} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">Selanjutnya</button>
          </div>
        </div>
      )}
    </div>
  )
}
