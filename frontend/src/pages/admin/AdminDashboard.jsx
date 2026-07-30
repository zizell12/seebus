import React, { useCallback, useEffect, useState } from 'react'
import {
  Inbox,
  MailOpen,
  MailWarning,
  Search,
  Trash2,
  CheckCheck,
  Mail,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-navy-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function PesanCard({ pesan, t, onTandaiDibaca, onHapus, actionLoading }) {
  const belumDibaca = pesan.status === 'baru'
  return (
    <div className={`card ${belumDibaca ? 'border-brand-red/30 bg-brand-red/[0.02]' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-navy-900 truncate">{pesan.nama}</h3>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                belumDibaca ? 'bg-brand-red/10 text-brand-red' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {belumDibaca ? t.adminPage.badgeBaru : t.adminPage.badgeDibaca}
            </span>
          </div>
          <a href={`mailto:${pesan.email}`} className="text-xs text-brand-teal hover:underline break-all">
            {pesan.email}
          </a>
        </div>
        <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
          {new Date(pesan.created_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <p className="text-xs text-gray-400 mb-1">
        {t.adminPage.labelSubjek}: <span className="text-navy-900 font-medium">{pesan.subjek}</span>
      </p>
      <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">{pesan.pesan}</p>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
        <a
          href={`mailto:${pesan.email}?subject=Re: ${encodeURIComponent(pesan.subjek || '')}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" /> {t.adminPage.balasEmail}
        </a>
        {belumDibaca && (
          <button
            onClick={() => onTandaiDibaca(pesan.pesan_id)}
            disabled={actionLoading === pesan.pesan_id}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal border border-brand-teal/30 px-3 py-1.5 rounded-lg hover:bg-brand-teal/5 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" /> {t.adminPage.tandaiDibaca}
          </button>
        )}
        <button
          onClick={() => onHapus(pesan.pesan_id)}
          disabled={actionLoading === pesan.pesan_id}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red border border-brand-red/20 px-3 py-1.5 rounded-lg hover:bg-brand-red/5 transition-colors disabled:opacity-50 ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t.adminPage.hapus}
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [cari, setCari] = useState('')
  const [cariAktif, setCariAktif] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  const muatPesan = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getAdminPesan({ status: status || undefined, cari: cariAktif || undefined, page })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [status, cariAktif, page])

  useEffect(() => {
    muatPesan()
  }, [muatPesan])

  const handleCariSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setCariAktif(cari)
  }

  const handleFilter = (s) => {
    setStatus(s)
    setPage(1)
  }

  const handleTandaiDibaca = async (id) => {
    setActionLoading(id)
    try {
      await api.tandaiPesanDibaca(id)
      await muatPesan()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleHapus = async (id) => {
    if (!window.confirm(t.adminPage.konfirmasiHapus)) return
    setActionLoading(id)
    try {
      await api.hapusPesan(id)
      await muatPesan()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const daftarPesan = data?.data || []
  const stats = data?.stats || { total: 0, baru: 0, dibaca: 0 }
  const halamanSekarang = data?.current_page || 1
  const totalHalaman = data?.last_page || 1

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminPage.judul}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.adminPage.subJudul}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Inbox} label={t.adminPage.statTotal} value={stats.total} accent="bg-navy-900/5 text-navy-900" />
        <StatCard icon={MailWarning} label={t.adminPage.statBaru} value={stats.baru} accent="bg-brand-red/10 text-brand-red" />
        <StatCard icon={MailOpen} label={t.adminPage.statDibaca} value={stats.dibaca} accent="bg-brand-teal/10 text-brand-teal" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-navy-900">{t.adminPage.pesanMasukJudul}</h2>
          <p className="text-sm text-gray-500">{t.adminPage.pesanMasukDeskripsi}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 my-5">
        <form onSubmit={handleCariSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={t.adminPage.cariPlaceholder}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
          />
        </form>
        <div className="flex gap-2 shrink-0">
          {[
            { key: '', label: t.adminPage.filterSemua },
            { key: 'baru', label: t.adminPage.filterBaru },
            { key: 'dibaca', label: t.adminPage.filterDibaca },
          ].map((f) => (
            <button
              key={f.key || 'semua'}
              onClick={() => handleFilter(f.key)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
                status === f.key
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'text-navy-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-10">{t.adminPage.memuat}</p>}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm text-brand-red mb-3">{t.adminPage.gagalMuat}</p>
          <button
            onClick={muatPesan}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.adminPage.muatUlang}
          </button>
        </div>
      )}

      {!loading && !error && daftarPesan.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">
          {cariAktif || status ? t.adminPage.tidakDitemukan : t.adminPage.kosong}
        </p>
      )}

      {!loading && !error && daftarPesan.length > 0 && (
        <>
          <div className="space-y-4">
            {daftarPesan.map((p) => (
              <PesanCard
                key={p.pesan_id}
                pesan={p}
                t={t}
                onTandaiDibaca={handleTandaiDibaca}
                onHapus={handleHapus}
                actionLoading={actionLoading}
              />
            ))}
          </div>

          {totalHalaman > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={halamanSekarang <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t.adminPage.sebelumnya}
              </button>
              <span className="text-xs text-gray-400">
                {t.adminPage.halamanInfo.replace('{halaman}', halamanSekarang).replace('{total}', totalHalaman)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalHalaman, p + 1))}
                disabled={halamanSekarang >= totalHalaman}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {t.adminPage.selanjutnya} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
