import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

const HARI_KEYS = [
  { value: 1, key: 'hariSenin' },
  { value: 2, key: 'hariSelasa' },
  { value: 3, key: 'hariRabu' },
  { value: 4, key: 'hariKamis' },
  { value: 5, key: 'hariJumat' },
  { value: 6, key: 'hariSabtu' },
  { value: 0, key: 'hariMinggu' },
]

export default function AdminJadwalGenerate() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [options, setOptions] = useState({ routes: [], bus_types: [] })
  const [routeId, setRouteId] = useState('')
  const [busTypeId, setBusTypeId] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [hariTerpilih, setHariTerpilih] = useState([1, 2, 3, 4, 5, 6, 0])
  const [jamList, setJamList] = useState([''])
  const [hargaDewasa, setHargaDewasa] = useState('')
  const [hargaAnak, setHargaAnak] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminJadwalOptions().then(setOptions).catch(() => {})
  }, [])

  const toggleHari = (value) => {
    setHariTerpilih((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const setJam = (index, value) => {
    setJamList((prev) => prev.map((j, i) => (i === index ? value : j)))
  }

  const tambahBarisJam = () => setJamList((prev) => [...prev, ''])
  const hapusBarisJam = (index) => setJamList((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (hariTerpilih.length === 0) {
      setError(t.adminJadwalPage.pilihMinimalSatuHari)
      return
    }

    const jamValid = jamList.map((j) => j.trim()).filter(Boolean)
    if (jamValid.length === 0) {
      setError(t.adminJadwalPage.pilihMinimalSatuJam)
      return
    }

    setSubmitting(true)
    try {
      const res = await api.generateJadwal({
        route_id: routeId,
        bus_type_id: busTypeId,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        hari: hariTerpilih,
        jam: jamValid,
        av_price: { adult: Number(hargaDewasa), child: Number(hargaAnak) },
      })
      navigate('/admin/jadwal', {
        state: { notice: t.adminJadwalPage.generateBerhasil.replace('{dibuat}', res.dibuat ?? 0) },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{t.adminJadwalPage.formGenerateJudul}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.adminJadwalPage.generateSubJudul}</p>
        </div>
        <Link
          to="/admin/jadwal"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adminJadwalPage.kembali}
        </Link>
      </div>

      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 max-w-3xl">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelRute}</label>
          <select
            required
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
          >
            <option value="">{t.adminJadwalPage.pilihRute}</option>
            {options.routes.map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelTipeBus}</label>
          <select
            required
            value={busTypeId}
            onChange={(e) => setBusTypeId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
          >
            <option value="">{t.adminJadwalPage.pilihTipeBus}</option>
            {options.bus_types.map((bt) => (
              <option key={bt.bus_type_id} value={bt.bus_type_id}>
                {bt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelTanggalMulai}</label>
            <input
              required
              type="date"
              value={tanggalMulai}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelTanggalSelesai}</label>
            <input
              required
              type="date"
              value={tanggalSelesai}
              min={tanggalMulai || new Date().toISOString().split('T')[0]}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">{t.adminJadwalPage.labelHari}</label>
          <div className="flex flex-wrap gap-2">
            {HARI_KEYS.map(({ value, key }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleHari(value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  hariTerpilih.includes(value)
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                {t.adminJadwalPage[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">{t.adminJadwalPage.labelJamList}</label>
          <div className="space-y-2">
            {jamList.map((jam, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  required
                  type="time"
                  value={jam}
                  onChange={(e) => setJam(index, e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
                />
                {jamList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => hapusBarisJam(index)}
                    className="text-gray-400 hover:text-brand-red"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={tambahBarisJam}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5" /> {t.adminJadwalPage.tambahJam}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelHargaDewasa}</label>
            <input
              required
              type="number"
              min="0"
              value={hargaDewasa}
              onChange={(e) => setHargaDewasa(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t.adminJadwalPage.labelHargaAnak}</label>
            <input
              required
              type="number"
              min="0"
              value={hargaAnak}
              onChange={(e) => setHargaAnak(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/jadwal')}
            className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
          >
            {t.adminJadwalPage.batal}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
          >
            {submitting ? t.adminJadwalPage.menggenerate : t.adminJadwalPage.generate}
          </button>
        </div>
      </form>
    </div>
  )
}
