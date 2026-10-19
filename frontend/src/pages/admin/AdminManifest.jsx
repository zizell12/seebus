import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminManifest() {
  const { id } = useParams()
  const { t } = useLanguage()
  const labels = t.manifestPage
  const [manifest, setManifest] = useState(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.getAdminManifest(id)
      .then((response) => setManifest(response.data))
      .catch((err) => setError(err.message))
  }, [id])

  const downloadCsv = async () => {
    setDownloading(true)
    setError('')
    try {
      const blob = await api.downloadAdminManifestCsv(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `manifest-${id}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (!manifest && error) return <div className="max-w-6xl mx-auto px-4 py-10 text-brand-red">{error}</div>
  if (!manifest) return <div className="max-w-6xl mx-auto px-4 py-10 text-center text-gray-400">{labels.loading}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 manifest-print-container">
      <style>{`
        @media print {
          @page { size: landscape; margin: 12mm; }
          body { background: white !important; }
          .manifest-print-hidden { display: none !important; }
          .manifest-print-container { max-width: none !important; padding: 0 !important; }
          .manifest-print-card { border: 0 !important; box-shadow: none !important; }
        }
      `}</style>
      <div className="flex items-center justify-between gap-3 mb-5 manifest-print-hidden">
        <Link to="/admin/jadwal" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900">
          <ArrowLeft className="w-4 h-4" /> {labels.back}
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900">
            <Printer className="w-4 h-4" /> {labels.print}
          </button>
          <button disabled={downloading} onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Download className="w-4 h-4" /> {downloading ? '...' : labels.csv}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-brand-red manifest-print-hidden">{error}</p>}
      <div className="card p-5 md:p-7 manifest-print-card">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{labels.title} · #{manifest.availability_id}</p>
          <h1 className="text-2xl font-bold text-navy-900">{manifest.asal} → {manifest.tujuan}</h1>
          <p className="text-sm text-gray-500">
            {manifest.tanggal} · {manifest.jam} · {manifest.operator} · {manifest.kelas} · {manifest.armada}
          </p>
        </div>
        <section className="mb-8">
          <h2 className="mb-3 font-bold text-navy-900">{labels.stop}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-4">{labels.stop}</th><th className="py-2 pr-4">{labels.boarding}</th><th className="py-2">{labels.alighting}</th>
              </tr></thead>
              <tbody>{manifest.ringkasan_titik.map((stop) => (
                <tr key={stop.route_stop_id} className="border-b border-gray-50">
                  <td className="py-2 pr-4">{stop.nama}</td><td className="py-2 pr-4">{stop.jumlah_naik}</td><td className="py-2">{stop.jumlah_turun}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        {manifest.penumpang.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{labels.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2.5 pr-4">{labels.booking}</th>
                  <th className="py-2.5 pr-4">{labels.passenger}</th>
                  <th className="py-2.5 pr-4">{labels.category}</th>
                  <th className="py-2.5 pr-4">{labels.seat}</th>
                  <th className="py-2.5 pr-4">{labels.contact}</th>
                  <th className="py-2.5 pr-4">Naik</th>
                  <th className="py-2.5 pr-0">Turun</th>
                </tr>
              </thead>
              <tbody>
                {manifest.penumpang.map((passenger, index) => (
                  <tr key={`${passenger.booking_id}-${index}`} className="border-b border-gray-50">
                    <td className="py-3 pr-4 whitespace-nowrap font-medium text-navy-900">{passenger.bk_code}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-navy-900">{passenger.ps_name}</p>
                      <p className="text-xs text-gray-400">{passenger.ps_age} tahun · {passenger.ps_gender}</p>
                    </td>
                    <td className="py-3 pr-4">{passenger.ps_category}</td>
                    <td className="py-3 pr-4 font-semibold">{passenger.label_kursi}</td>
                    <td className="py-3 pr-4">
                      <p>{passenger.kontak_nama || '—'}</p>
                      <p className="text-xs text-gray-400">{passenger.kontak_telepon || '—'}</p>
                    </td>
                    <td className="py-3 pr-4">{passenger.naik_dari || '—'}</td>
                    <td className="py-3 pr-0">{passenger.turun_di || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
