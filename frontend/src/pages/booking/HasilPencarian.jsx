import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, ChevronDown, Wifi, Snowflake, Coffee, ArrowRight } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import PenumpangPicker from '../../components/PenumpangPicker'
import { useBooking, totalPenumpang } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { getFasilitasLabel, getTipeLabel, getWaktuKategoriLabel } from '../../utils/busHelpers'
import { api } from '../../utils/api'
import backgrounddb from '../../assets/background-db.png'
const tipeBusKeys = ['Eksekutif', 'Sleeper', 'Ekonomi']
const waktuKeys = ['dini-hari', 'pagi', 'siang-sore', 'malam']
const fasilitasIcons = {
  ac: Snowflake,
  wifi: Wifi,
  snack: Coffee,
}
const fasilitasKeys = ['ac', 'wifi', 'snack']
const sortKeys = ['harga', 'durasi', 'berangkat']
function jamKeMenit(jam) {
  const [h, m] = jam.split(':').map(Number)
  return h * 60 + m
}
function durasiKeMenit(durasi) {
  const match = durasi.match(/(\d+)j(?:\s*(\d+)m)?/)
  if (!match) return 0
  const jam = Number(match[1])
  const menit = Number(match[2] || 0)
  return jam * 60 + menit
}
function BusCard({ bus, onPilih, t }) {
  return (
    <div className="card flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      <div className="flex-1">
        {bus.rekomendasi && (
          <span className="text-xs font-semibold text-brand-red mb-1 block">{t.busList.rekomendasi.toUpperCase()}</span>
        )}
        {bus.ruteTercepat && (
          <span className="text-xs font-semibold text-brand-teal mb-1 block">
            {t.busList.ruteTercepat.toUpperCase()}
          </span>
        )}
        <h3 className="font-bold text-navy-900">{bus.operator}</h3>
        <p className="text-xs text-gray-400 mb-3">{bus.kelas}</p>

        <div className="flex items-center gap-4">
          <div>
            <p className="font-bold text-navy-900">{bus.jamBerangkat}</p>
            <p className="text-xs text-gray-400">{bus.terminalAsal || bus.dari}</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-2">
            <span className="text-xs text-gray-400 mb-1">{bus.durasi}</span>
            <div className="w-full h-px bg-gray-200 relative">
              <ArrowRight className="w-3 h-3 text-gray-400 absolute right-0 -top-1.5 bg-white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-navy-900">{bus.jamTiba}</p>
            <p className="text-xs text-gray-400">{bus.terminalTujuan || bus.tujuan}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-3">
          {bus.fasilitas.map((f) => {
            const Icon = fasilitasIcons[f]
            if (!Icon) return null
            return <Icon key={f} className="w-4 h-4 text-gray-400" title={getFasilitasLabel(f, t)} />
          })}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-navy-900 text-lg">Rp {bus.harga.toLocaleString('id-ID')}</p>
        <p className="text-xs text-gray-400 mb-3">{bus.diskon}</p>
        <button
          onClick={() => onPilih(bus)}
          className="bg-brand-red text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-red/90 transition-colors"
        >
          {t.busList.lihatDetail}
        </button>
      </div>
    </div>
  )
}
export default function HasilPencarian() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { booking, selectBus, updateSearch } = useBooking()
  const { dari, tujuan, tanggal, penumpang } = booking.search
  const [hasil, setHasil] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editTanggal, setEditTanggal] = useState(tanggal)
  const [editPenumpang, setEditPenumpang] = useState(penumpang)
  const bukaEdit = () => {
    setEditTanggal(tanggal)
    setEditPenumpang(penumpang)
    setEditMode(true)
  }
  const handleUbahSubmit = (e) => {
    e.preventDefault()
    updateSearch({
      ...booking.search,
      tanggal: editTanggal,
      penumpang: editPenumpang,
    })
    setEditMode(false)
  }
  const [draftFilter, setDraftFilter] = useState({
    tipeBus: null,
    waktu: null,
    hargaMin: '',
    hargaMax: '',
    fasilitas: [],
  })
  const [appliedFilter, setAppliedFilter] = useState({
    tipeBus: null,
    waktu: null,
    hargaMin: '',
    hargaMax: '',
    fasilitas: [],
  })
  const pilihTunggal = (key, value) => {
    setDraftFilter((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }))
  }
  const toggleFasilitas = (value) => {
    setDraftFilter((prev) => ({
      ...prev,
      fasilitas: prev.fasilitas.includes(value)
        ? prev.fasilitas.filter((v) => v !== value)
        : [...prev.fasilitas, value],
    }))
  }
  const [sortBy, setSortBy] = useState('harga')
  const [sortOpen, setSortOpen] = useState(false)
  const handlePilihBus = (bus) => {
    selectBus({
      availability_id: bus.availability_id,
      id: bus.availability_id,
      operator: bus.operator,
      kelas: bus.kategori || bus.tipe,
      fasilitas: bus.fasilitas,
      dari: bus.dari,
      tujuan: bus.tujuan,
      terminalAsal: bus.terminalAsal,
      terminalTujuan: bus.terminalTujuan,
      tanggal: bus.tanggal,
      jamBerangkat: bus.jam_berangkat,
      jamTiba: bus.jam_tiba || '',
      harga: bus.harga,
      hargaAnak: bus.harga_anak,
      kursiTersedia: bus.kursi_tersedia,
    })
    navigate('/pemesanan/penumpang')
  }
  const [visibleCount, setVisibleCount] = useState(3)
  const sortLabel = (key) => {
    if (key === 'harga') return t.busList.urutkanHarga
    if (key === 'durasi') return t.busList.urutkanDurasi
    return t.busList.urutkanBerangkat
  }

  function getWaktuKategoriFromJam(jam) {
    const hour = Number(jam.split(':')[0])
    if (hour < 5) return 'dini-hari'
    if (hour < 12) return 'pagi'
    if (hour < 17) return 'siang-sore'
    return 'malam'
  }

  useEffect(() => {
    async function loadJadwal() {
      if (!dari || !tujuan || !tanggal) {
        setHasil([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await api.cariJadwal({ dari, tujuan, tanggal })
        const mapped = result.map((item) => ({
          ...item,
          id: item.availability_id,
          tipe: item.kategori,
          waktuKategori: getWaktuKategoriFromJam(item.jam_berangkat),
          durasi: item.durasi_menit ? `${Math.floor(item.durasi_menit / 60)}j ${item.durasi_menit % 60}m` : '',
          jamTiba: item.jam_tiba || '',
          terminalAsal: item.terminal_asal || '',
          terminalTujuan: item.terminal_tujuan || '',
        }))
        setHasil(mapped)
      } catch (err) {
        setError(err.message || 'Gagal memuat jadwal')
        setHasil([])
      }
      setLoading(false)
    }

    loadJadwal()
  }, [dari, tujuan, tanggal])
  const hasilFiltered = useMemo(() => {
    let candidates = hasil
    if (appliedFilter.tipeBus) candidates = candidates.filter((b) => b.tipe === appliedFilter.tipeBus)
    if (appliedFilter.waktu) candidates = candidates.filter((b) => b.waktuKategori === appliedFilter.waktu)
    if (appliedFilter.fasilitas.length)
      candidates = candidates.filter((b) => appliedFilter.fasilitas.every((f) => b.fasilitas.includes(f)))
    if (appliedFilter.hargaMin) candidates = candidates.filter((b) => b.harga >= Number(appliedFilter.hargaMin))
    if (appliedFilter.hargaMax) candidates = candidates.filter((b) => b.harga <= Number(appliedFilter.hargaMax))
    return [...candidates].sort((a, b) => {
      if (sortBy === 'harga') return a.harga - b.harga
      if (sortBy === 'durasi') return durasiKeMenit(a.durasi) - durasiKeMenit(b.durasi)
      return jamKeMenit(a.jamBerangkat) - jamKeMenit(b.jamBerangkat)
    })
  }, [dari, tujuan, appliedFilter, sortBy, hasil])
  const hasilTampil = hasilFiltered.slice(0, visibleCount)
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgrounddb})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 text-center">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-6">{t.hero.title}</h1>
          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      <div className="bg-navy-900 mt-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          {!editMode ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <MapPin className="w-4 h-4 text-brand-red" />
                {dari} <ArrowRight className="w-4 h-4 text-white/50" /> {tujuan}
              </div>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {tanggal &&
                    new Date(tanggal).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {totalPenumpang(penumpang)} {t.search.orangSingular}
                </span>
                <button
                  onClick={bukaEdit}
                  className="bg-white text-navy-900 text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  {t.busList.ubah}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <form onSubmit={handleUbahSubmit} className="bg-white rounded-xl p-3 flex items-end gap-3 w-fit">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
                    <Calendar className="w-4 h-4" /> {t.search.tanggal}
                  </label>
                  <input
                    type="date"
                    className="outline-none text-sm text-navy-900 border rounded-lg px-3 py-2 w-40"
                    value={editTanggal}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditTanggal(e.target.value)}
                  />
                </div>
                <div className="border rounded-lg px-3 py-2">
                  <PenumpangPicker value={editPenumpang} onChange={setEditPenumpang} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary px-4 h-[42px] whitespace-nowrap text-sm">
                    {t.busList.terapkan}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="text-gray-400 text-xs px-2">
                    {t.busList.batal}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="card h-fit md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900 text-sm">{t.busList.filter}</h3>
            <button
              onClick={() =>
                setDraftFilter({
                  tipeBus: null,
                  waktu: null,
                  hargaMin: '',
                  hargaMax: '',
                  fasilitas: [],
                })
              }
              className="text-xs text-brand-red font-medium"
            >
              {t.busList.reset}
            </button>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-navy-900 mb-2">{t.busList.filterTipe}</p>
            <div className="space-y-2">
              {tipeBusKeys.map((tipeKey) => (
                <label key={tipeKey} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={draftFilter.tipeBus === tipeKey}
                    onChange={() => pilihTunggal('tipeBus', tipeKey)}
                    className="rounded accent-navy-900"
                  />
                  {getTipeLabel(tipeKey, t)}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-navy-900 mb-2">{t.busList.filterWaktu}</p>
            <div className="grid grid-cols-2 gap-2">
              {waktuKeys.map((waktuKey) => (
                <button
                  key={waktuKey}
                  type="button"
                  onClick={() => pilihTunggal('waktu', waktuKey)}
                  className={`text-left rounded-lg border px-2.5 py-2 text-xs transition-colors ${draftFilter.waktu === waktuKey ? 'border-navy-900 bg-navy-900/5 text-navy-900' : 'border-gray-200 text-gray-500'}`}
                >
                  <span className="block font-medium">{getWaktuKategoriLabel(waktuKey, t)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-navy-900 mb-2">{t.busList.rentangHarga}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder={t.busList.hargaMinPlaceholder}
                value={draftFilter.hargaMin}
                onChange={(e) =>
                  setDraftFilter({
                    ...draftFilter,
                    hargaMin: Math.max(0, Number(e.target.value)) || '',
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                min="0"
                placeholder={t.busList.hargaMaksPlaceholder}
                value={draftFilter.hargaMax}
                onChange={(e) =>
                  setDraftFilter({
                    ...draftFilter,
                    hargaMax: Math.max(0, Number(e.target.value)) || '',
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
              />
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-navy-900 mb-2">{t.busList.filterFasilitas}</p>
            <div className="flex flex-wrap gap-2">
              {fasilitasKeys.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFasilitas(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${draftFilter.fasilitas.includes(f) ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-500'}`}
                >
                  {getFasilitasLabel(f, t)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setAppliedFilter(draftFilter)
              setVisibleCount(3)
            }}
            className="w-full bg-navy-900 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-navy-800 transition-colors"
          >
            {t.busList.simpanFilter}
          </button>
        </aside>

        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-4 relative">
            <p className="text-sm text-gray-500">{hasilFiltered.length} {t.busList.busDitemukan}</p>
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1 text-navy-900 font-medium text-sm"
              >
                {t.busList.urutkan}: {sortLabel(sortBy)}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden z-10 w-56">
                  {sortKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key)
                        setSortOpen(false)
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${sortBy === key ? 'text-brand-red font-medium' : 'text-gray-600'}`}
                    >
                      {sortLabel(key)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {hasilTampil.length === 0 ? (
            <div className="card text-center text-sm text-gray-500 py-10">{t.busList.tidakAdaHasil}</div>
          ) : (
            <div className="space-y-4">
              {hasilTampil.map((bus) => (
                <BusCard key={bus.id} bus={bus} onPilih={handlePilihBus} t={t} />
              ))}
            </div>
          )}

          {visibleCount < hasilFiltered.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisibleCount((v) => v + 3)}
                className="flex items-center gap-1 mx-auto text-navy-900 font-medium text-sm border border-navy-900 rounded-xl px-5 py-2.5 hover:bg-navy-900/5 transition-colors"
              >
                {t.busList.tampilkanLebih} <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
