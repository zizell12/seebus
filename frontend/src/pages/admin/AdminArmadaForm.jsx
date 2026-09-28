import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, X, Bus, Sparkles } from 'lucide-react'
import { api } from '../../utils/api'

function FasilitasPicker({ fasilitasUmum, value, onChange }) {
  const [custom, setCustom] = useState('')

  const toggle = (nama) => {
    if (value.includes(nama)) {
      onChange(value.filter((f) => f !== nama))
    } else {
      onChange([...value, nama])
    }
  }

  const tambahCustom = () => {
    const nama = custom.trim()
    if (!nama || value.includes(nama)) return
    onChange([...value, nama])
    setCustom('')
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Fasilitas</label>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {fasilitasUmum.map((f) => {
          const aktif = value.includes(f)
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                aktif ? 'bg-navy-900 text-white border-navy-900' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mb-2.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              tambahCustom()
            }
          }}
          placeholder="Fasilitas lain..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
        />
        <button
          type="button"
          onClick={tambahCustom}
          className="text-xs font-semibold text-navy-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          Tambah
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full"
            >
              {f}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== f))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminArmadaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const initial = isEdit ? location.state?.item || null : null

  const [options, setOptions] = useState({ bus_types: [], fasilitas_umum: [] })
  const [busTypeId, setBusTypeId] = useState(initial?.bus_type_id ? String(initial.bus_type_id) : '')
  const [kode, setKode] = useState(initial?.bu_code || '')
  const [platNomor, setPlatNomor] = useState(initial?.bu_plate_number || '')
  const [kapasitas, setKapasitas] = useState(initial?.bu_capacity ?? '')
  const [fasilitas, setFasilitas] = useState(initial?.bu_facilities || [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminBusUnitOptions().then(setOptions).catch(() => {})
  }, [])

  if (isEdit && !initial) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <p className="text-sm text-gray-500 mb-4">Data armada tidak ditemukan, kembali ke daftar.</p>
        <Link
          to="/admin/armada"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = {
      bus_type_id: Number(busTypeId),
      bu_code: kode,
      bu_plate_number: platNomor || null,
      bu_capacity: Number(kapasitas),
      bu_facilities: fasilitas,
    }
    try {
      if (isEdit) {
        await api.ubahBusUnit(initial.bus_unit_id, payload)
        navigate('/admin/armada', { state: { notice: 'Armada berhasil diperbarui.' } })
      } else {
        await api.tambahBusUnit(payload)
        navigate('/admin/armada', { state: { notice: 'Armada baru berhasil ditambahkan.' } })
      }
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
          <h1 className="text-xl md:text-2xl font-bold text-navy-900">{isEdit ? 'Edit Armada' : 'Tambah Armada'}</h1>
          <p className="text-sm text-gray-500 mt-1">Satu armada = satu unit bus fisik dengan plat nomor sendiri.</p>
        </div>
        <Link
          to="/admin/armada"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>

      {error && (
        <div className="text-sm text-brand-red bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="card space-y-4 lg:col-span-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Kelas Bus</label>
            <select
              required
              value={busTypeId}
              onChange={(e) => setBusTypeId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="">Pilih kelas bus</option>
              {options.bus_types.map((bt) => (
                <option key={bt.bus_type_id} value={bt.bus_type_id}>
                  {bt.label}
                </option>
              ))}
            </select>
            {options.bus_types.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Belum ada kelas bus. Tambah dulu di menu{' '}
                <Link to="/admin/tipe-bus/tambah" className="font-semibold text-navy-900 underline">
                  Tipe Bus
                </Link>
                .
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Kode / Nama Unit</label>
              <input
                required
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="mis. Ramatrans Unit 1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Plat Nomor (opsional)</label>
              <input
                value={platNomor}
                onChange={(e) => setPlatNomor(e.target.value)}
                placeholder="mis. B 7123 AB"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Kapasitas Kursi</label>
            <input
              required
              type="number"
              min="1"
              max="100"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          <FasilitasPicker fasilitasUmum={options.fasilitas_umum || []} value={fasilitas} onChange={setFasilitas} />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/armada')}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-white bg-brand-red px-4 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Preview
          </p>
          <div className="card">
            <h3 className="font-bold text-navy-900 flex items-center gap-1.5">
              <Bus className="w-4 h-4" /> {kode || 'Kode unit'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{platNomor || 'Plat nomor -'}</p>
            <p className="text-xs text-gray-500 mt-2">Kapasitas: {kapasitas || 0} kursi</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5 min-h-[1.5rem]">
              {fasilitas.length === 0 && <span className="text-xs text-gray-400">Belum ada fasilitas</span>}
              {fasilitas.map((f) => (
                <span key={f} className="text-[11px] font-semibold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
