import React, { useCallback, useEffect, useState } from 'react'
import { Calendar, Download, Info, Ticket, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../utils/api'

const GROUPS = [
  { key: 'periode', label: 'Per Periode' },
  { key: 'po', label: 'Per PO' },
  { key: 'rute', label: 'Per Rute' },
]
const MODE_LABEL = { harian: 'Harian', bulanan: 'Bulanan', tahunan: 'Tahunan' }
const EMPTY_FILTERS = { kelompok: 'periode', mode: 'harian', dari: '', sampai: '', company_id: '', route_id: '' }

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`
}

function formatPeriode(period, mode) {
  if (!period) return 'Tidak diketahui'
  if (mode === 'tahunan') return period
  if (mode === 'bulanan') {
    const [year, month] = period.split('-')
    const name = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(month) - 1]
    return `${name} ${year}`
  }
  const date = new Date(`${period}T00:00:00`)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function InfoTooltip({ children }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info
        tabIndex={0}
        aria-label={children}
        className="w-3.5 h-3.5 text-gray-400 cursor-help"
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  )
}

function SummaryCard({ icon: Icon, label, value, accent, help, money = true }) {
  return (
    <div className="card flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          {label}
          {help && <InfoTooltip>{help}</InfoTooltip>}
        </p>
        <p className="text-lg font-bold text-navy-900">{money ? formatRupiah(value) : Number(value || 0).toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

function getInitialFilters(searchParams) {
  const group = searchParams.get('kelompok')
  const mode = searchParams.get('mode')
  return {
    kelompok: GROUPS.some((item) => item.key === group) ? group : 'periode',
    mode: Object.prototype.hasOwnProperty.call(MODE_LABEL, mode) ? mode : 'harian',
    dari: searchParams.get('dari') || '',
    sampai: searchParams.get('sampai') || '',
    company_id: searchParams.get('company_id') || '',
    route_id: searchParams.get('route_id') || '',
  }
}

export default function AdminRekap() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => getInitialFilters(searchParams))
  const [data, setData] = useState(null)
  const [companies, setCompanies] = useState([])
  const [routes, setRoutes] = useState([])
  const [optionsError, setOptionsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [settlementLoading, setSettlementLoading] = useState('')

  useEffect(() => {
    setFilters(getInitialFilters(searchParams))
  }, [searchParams])

  useEffect(() => {
    let active = true
    Promise.all([api.getAdminBusTypeOptions(), api.getAdminJadwalOptions()])
      .then(([companyOptions, scheduleOptions]) => {
        if (!active) return
        setCompanies(companyOptions.companies || [])
        setRoutes(scheduleOptions.routes || [])
      })
      .catch((err) => {
        if (active) setOptionsError(err.message)
      })
    return () => { active = false }
  }, [])

  const muatData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getBookingRekap({
        kelompok: filters.kelompok,
        mode: filters.kelompok === 'periode' ? filters.mode : undefined,
        dari: filters.dari || undefined,
        sampai: filters.sampai || undefined,
        company_id: filters.company_id || undefined,
        route_id: filters.route_id || undefined,
      })
      setData(res)
    } catch (err) {
      setData(null)
      const fromError = err.responseData?.errors?.dari?.[0] || ''
      setError(err.status === 422 && /tanggal awal tidak boleh setelah tanggal akhir/i.test(fromError)
        ? 'Rentang tanggal tidak valid: tanggal Dari harus sebelum atau sama dengan tanggal Sampai.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    muatData()
  }, [muatData])

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    const params = new URLSearchParams()
    if (nextFilters.kelompok !== EMPTY_FILTERS.kelompok) params.set('kelompok', nextFilters.kelompok)
    if (nextFilters.kelompok === 'periode' && nextFilters.mode !== EMPTY_FILTERS.mode) params.set('mode', nextFilters.mode)
    if (nextFilters.dari) params.set('dari', nextFilters.dari)
    if (nextFilters.sampai) params.set('sampai', nextFilters.sampai)
    if (nextFilters.company_id) params.set('company_id', nextFilters.company_id)
    if (nextFilters.route_id) params.set('route_id', nextFilters.route_id)
    setSearchParams(params, { replace: true })
  }

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      await api.exportBookingRekap({
        kelompok: filters.kelompok,
        mode: filters.kelompok === 'periode' ? filters.mode : undefined,
        dari: data?.dari || filters.dari || undefined,
        sampai: data?.sampai || filters.sampai || undefined,
        company_id: filters.company_id || undefined,
        route_id: filters.route_id || undefined,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleSettlementExport = async (companyId, rowKey) => {
    setSettlementLoading(String(rowKey))
    setError('')
    try {
      await api.exportSetoranPO({
        company_id: companyId,
        dari: data?.dari || filters.dari || undefined,
        sampai: data?.sampai || filters.sampai || undefined,
        route_id: filters.route_id || undefined,
      })
    } catch (err) {
      setError(`Gagal mengunduh rincian setoran: ${err.message}`)
    } finally {
      setSettlementLoading('')
    }
  }

  const rincian = data?.rincian || []
  const summary = data?.ringkasan || {}
  const grouped = filters.kelompok !== 'periode'
  const rows = grouped
    ? rincian.map((row) => ({ ...row, rowKey: row.kunci === null ? 'unknown' : String(row.kunci) }))
    : rincian.map((row) => ({ ...row, rowKey: row.periode }))

  const tableColumns = grouped
    ? [
        ['jumlah_booking', 'Booking', false],
        ['jumlah_tiket', 'Tiket', false],
        ['pendapatan_tiket', 'Pendapatan Tiket', true],
        ['biaya_layanan', 'Biaya Layanan', true],
        ['komisi_platform', 'Komisi Platform', true],
        ['setoran_po', 'Setoran PO', true],
        ['siap_disetor', 'Siap Disetor', true],
        ['belum_berangkat', 'Belum Berangkat', true],
        ['jumlah_pembatalan', 'Pembatalan', false],
        ['total_refund', 'Refund', true],
        ['ditahan', 'Ditahan', true],
        ['pendapatan_platform', 'Pendapatan Platform', true],
      ]
    : [
        ['jumlah_booking', 'Booking', false],
        ['jumlah_tiket', 'Tiket Terjual', false],
        ['pendapatan_tiket', 'Pendapatan Tiket', true],
        ['biaya_layanan', 'Biaya Layanan', true],
        ['total_pendapatan', 'Total Dibayar', true],
        ['komisi_platform', 'Komisi Platform', true],
        ['setoran_po', 'Setoran PO', true],
        ['siap_disetor', 'Siap Disetor', true],
        ['belum_berangkat', 'Belum Berangkat', true],
        ['jumlah_pembatalan', 'Pembatalan', false],
        ['dibayar_dibatalkan', 'Dibayar Dibatalkan', true],
        ['total_refund', 'Refund', true],
        ['ditahan', 'Ditahan', true],
        ['pendapatan_platform', 'Pendapatan Platform', true],
      ]

  const groupLabel = (row) => {
    if (row.kunci === null) return 'Tidak diketahui'
    return grouped ? row.label : formatPeriode(row.periode, filters.mode)
  }
  const showSettlementExport = (row) => {
    if (filters.kelompok === 'po') return row.kunci !== null
    return Boolean(filters.company_id)
  }
  const hasSettlementColumn = filters.kelompok === 'po' || Boolean(filters.company_id)
  const maximumPeriodRevenue = Math.max(1, ...rows.map((row) => Number(row.total_pendapatan || 0)))

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">Rekap Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan tiket, pendapatan, dan setoran PO sesuai kelompok dan rentang pilihan.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading || !data}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {exporting ? 'Mengunduh...' : 'Unduh CSV'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Kelompok rekap">
        {GROUPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filters.kelompok === key}
            onClick={() => updateFilter('kelompok', key)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
              filters.kelompok === key ? 'bg-navy-900 text-white border-navy-900' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        {filters.kelompok === 'periode' && (
          <label className="text-xs font-semibold text-gray-500">
            Periode
            <select value={filters.mode} onChange={(event) => updateFilter('mode', event.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-navy-900 bg-white">
              {Object.entries(MODE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs font-semibold text-gray-500">
          Dari
          <span className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="date" value={filters.dari} onChange={(event) => updateFilter('dari', event.target.value)} className="w-full text-sm font-normal text-navy-900 outline-none" />
          </span>
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Sampai
          <span className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="date" value={filters.sampai} onChange={(event) => updateFilter('sampai', event.target.value)} className="w-full text-sm font-normal text-navy-900 outline-none" />
          </span>
        </label>
        <label className="text-xs font-semibold text-gray-500">
          PO
          <select value={filters.company_id} onChange={(event) => updateFilter('company_id', event.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-navy-900 bg-white">
            <option value="">Semua</option>
            {companies.map((company) => <option key={company.company_id} value={company.company_id}>{company.co_name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Rute
          <select value={filters.route_id} onChange={(event) => updateFilter('route_id', event.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-navy-900 bg-white">
            <option value="">Semua</option>
            {routes.map((route) => <option key={route.route_id} value={route.route_id}>{route.label}</option>)}
          </select>
        </label>
      </div>

      {error && (
        <div role="alert" className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}
      {optionsError && (
        <div role="alert" className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          Gagal memuat pilihan PO/rute: {optionsError}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-10">Memuat data...</p>}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
            <SummaryCard icon={Ticket} label="Jumlah Booking" value={summary.jumlah_booking} money={false} accent="bg-navy-900/10 text-navy-900" />
            <SummaryCard icon={Ticket} label="Tiket Terjual" value={summary.jumlah_tiket} money={false} accent="bg-navy-900/10 text-navy-900" />
            <SummaryCard icon={TrendingUp} label="Pendapatan Tiket" value={summary.pendapatan_tiket} accent="bg-brand-teal/10 text-brand-teal" />
            <SummaryCard icon={TrendingUp} label="Biaya Layanan" value={summary.biaya_layanan} accent="bg-brand-red/10 text-brand-red" />
            <SummaryCard icon={TrendingUp} label="Total Dibayar" value={summary.total_pendapatan} accent="bg-amber-500/10 text-amber-700" />
            <SummaryCard icon={TrendingUp} label="Komisi Platform" value={summary.komisi_platform} accent="bg-purple-500/10 text-purple-700" />
            <SummaryCard icon={TrendingUp} label="Setoran PO" value={summary.setoran_po} accent="bg-blue-500/10 text-blue-700" />
            <SummaryCard
              icon={TrendingUp}
              label="Pendapatan Platform"
              value={summary.pendapatan_platform}
              accent="bg-brand-red/10 text-brand-red"
              help="Komisi + biaya layanan + bagian platform dari uang yang ditahan saat pembatalan."
            />
            <SummaryCard
              icon={TrendingUp}
              label="Siap Disetor ke PO"
              value={summary.siap_disetor}
              accent="bg-brand-teal/10 text-brand-teal"
              help="Uang PO dari booking lunas yang busnya sudah berangkat, ditambah bagian PO dari uang yang ditahan saat pembatalan. Sudah final, tidak bisa direfund lagi."
            />
            <SummaryCard
              icon={TrendingUp}
              label="Belum Berangkat"
              value={summary.belum_berangkat}
              accent="bg-amber-500/10 text-amber-700"
              help="Uang PO dari booking lunas yang busnya belum berangkat. Masih bisa dibatalkan atau direfund, jadi belum boleh disetor."
            />
          </div>

          {summary.jumlah_pembatalan > 0 && (
            <section className="card mb-8">
              <h2 className="text-sm font-bold text-navy-900 mb-3">Ringkasan pembatalan</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-xs text-gray-500">Jumlah pembatalan</p><p className="font-bold text-navy-900">{summary.jumlah_pembatalan}</p></div>
                <div><p className="text-xs text-gray-500">Dibayar dibatalkan</p><p className="font-bold text-navy-900">{formatRupiah(summary.dibayar_dibatalkan)}</p></div>
                <div><p className="text-xs text-gray-500">Total refund</p><p className="font-bold text-navy-900">{formatRupiah(summary.total_refund)}</p></div>
                <div><p className="text-xs text-gray-500">Ditahan</p><p className="font-bold text-navy-900">{formatRupiah(summary.ditahan)}</p></div>
              </div>
            </section>
          )}

          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Tidak ada data pada rentang ini</p>
          ) : (
            <section className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Rincian {GROUPS.find((group) => group.key === filters.kelompok)?.label.toLowerCase()}
              </p>
              {!grouped && (
                <div className="flex items-end gap-2 h-40 mb-5 overflow-x-auto">
                  {rows.map((row) => {
                    return (
                      <div key={row.rowKey} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 48 }}>
                        <div className="w-6 bg-navy-900 rounded-t-md" style={{ height: `${Math.max(4, (Number(row.total_pendapatan || 0) / maximumPeriodRevenue) * 130)}px` }} title={formatRupiah(row.total_pendapatan)} />
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatPeriode(row.periode, filters.mode)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-4 font-semibold">{grouped ? 'Kelompok' : 'Periode'}</th>
                      {tableColumns.map(([, label]) => <th key={label} className="py-2 px-2 font-semibold whitespace-nowrap">{label}</th>)}
                      {hasSettlementColumn && <th className="py-2 pl-2 font-semibold whitespace-nowrap">Rincian Setoran</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowKey} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-navy-900 font-medium whitespace-nowrap">{groupLabel(row)}</td>
                        {tableColumns.map(([field, label, money]) => (
                          <td key={label} className="py-2 px-2 text-navy-900 whitespace-nowrap">
                            {money ? formatRupiah(row[field]) : Number(row[field] || 0).toLocaleString('id-ID')}
                          </td>
                        ))}
                        {hasSettlementColumn && (
                          <td className="py-2 pl-2 whitespace-nowrap">
                            {showSettlementExport(row) && (
                              <button
                                onClick={() => handleSettlementExport(filters.kelompok === 'po' ? row.kunci : filters.company_id, row.rowKey)}
                                disabled={Boolean(settlementLoading)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Download className="w-3.5 h-3.5" />
                                {settlementLoading === row.rowKey ? 'Mengunduh...' : 'Unduh rincian'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td className="py-3 pr-4 text-navy-900">Total</td>
                      {tableColumns.map(([field, label, money]) => (
                        <td key={label} className="py-3 px-2 text-navy-900 whitespace-nowrap">
                          {money ? formatRupiah(summary[field]) : Number(summary[field] || 0).toLocaleString('id-ID')}
                        </td>
                      ))}
                      {hasSettlementColumn && <td className="py-3 pl-2" />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
