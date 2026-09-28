import React, { useCallback, useEffect, useState } from 'react'
import { TrendingUp, Ticket, Download, Calendar } from 'lucide-react'
import { api } from '../../utils/api'

const MODE_LABEL = { harian: 'Harian', bulanan: 'Bulanan', tahunan: 'Tahunan' }

function formatRupiah(angka) {
  return `Rp${Number(angka || 0).toLocaleString('id-ID')}`
}

function formatPeriode(periode, mode) {
  if (mode === 'tahunan') return periode
  if (mode === 'bulanan') {
    const [tahun, bulan] = periode.split('-')
    const nama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(bulan) - 1]
    return `${nama} ${tahun}`
  }
  const d = new Date(periode)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function AdminRekap() {
  const [mode, setMode] = useState('harian')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const muatData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getBookingRekap({ mode, dari: dari || undefined, sampai: sampai || undefined })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [mode, dari, sampai])

  useEffect(() => {
    muatData()
  }, [muatData])

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      await api.exportBookingRekap({ mode, dari: data?.dari, sampai: data?.sampai })
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const rincian = data?.rincian || []
  const nilaiMax = Math.max(1, ...rincian.map((r) => Number(r.total_pendapatan)))

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">Rekap Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan tiket terjual & pendapatan, bisa diekspor jadi laporan.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading || rincian.length === 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {exporting ? 'Mengekspor...' : 'Export CSV'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {Object.entries(MODE_LABEL).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
              mode === key ? 'bg-navy-900 text-white border-navy-900' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-navy-900/20"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={sampai}
            onChange={(e) => setSampai(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-navy-900/20"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-10">Memuat data...</p>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-navy-900/10 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-navy-900" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tiket Terjual</p>
                <p className="text-xl font-bold text-navy-900">{data.ringkasan.jumlah_tiket}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Pendapatan</p>
                <p className="text-xl font-bold text-navy-900">{formatRupiah(data.ringkasan.total_pendapatan)}</p>
              </div>
            </div>
          </div>

          {rincian.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Belum ada penjualan di rentang ini.</p>
          ) : (
            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Rincian per {MODE_LABEL[mode].toLowerCase()}
              </p>

              <div className="flex items-end gap-2 h-40 mb-4 overflow-x-auto">
                {rincian.map((r) => (
                  <div key={r.periode} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 44 }}>
                    <div
                      className="w-6 bg-navy-900 rounded-t-md"
                      style={{ height: `${Math.max(4, (Number(r.total_pendapatan) / nilaiMax) * 130)}px` }}
                      title={formatRupiah(r.total_pendapatan)}
                    />
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatPeriode(r.periode, mode)}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="py-2 font-semibold">Periode</th>
                      <th className="py-2 font-semibold">Tiket Terjual</th>
                      <th className="py-2 font-semibold">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincian.map((r) => (
                      <tr key={r.periode} className="border-b border-gray-50">
                        <td className="py-2 text-navy-900">{formatPeriode(r.periode, mode)}</td>
                        <td className="py-2 text-navy-900">{r.jumlah_tiket}</td>
                        <td className="py-2 text-navy-900 font-medium">{formatRupiah(r.total_pendapatan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
