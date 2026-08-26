import React, { useMemo, useState } from 'react'
import { Search, MapPin, ChevronRight, ChevronDown } from 'lucide-react'
import SearchForm from '../components/SearchForm'
import AutoText from '../components/AutoText'
import { useLanguage } from '../context/LanguageContext'
import { getTipeTerminalLabel } from '../utils/busHelpers'
import { provinsiPopuler, dataWilayah, totalTerminalAktif } from '../data/wilayahData'
const JUMLAH_AWAL = 4
export default function Wilayah() {
  const { t } = useLanguage()
  const [provinsiAktif, setProvinsiAktif] = useState(provinsiPopuler[0])
  const [pencarian, setPencarian] = useState('')
  const [jumlahTampil, setJumlahTampil] = useState(JUMLAH_AWAL)
  const wilayah = dataWilayah[provinsiAktif]
  const kotaTersaring = useMemo(() => {
    if (!pencarian.trim()) return wilayah.kota
    const kata = pencarian.toLowerCase()
    return wilayah.kota.filter(
      (k) => k.nama.toLowerCase().includes(kata) || k.terminals.some((term) => term.nama.toLowerCase().includes(kata)),
    )
  }, [wilayah, pencarian])
  const kotaDitampilkan = kotaTersaring.slice(0, jumlahTampil)
  const masihAdaLagi = jumlahTampil < kotaTersaring.length
  const pilihProvinsi = (p) => {
    setProvinsiAktif(p)
    setJumlahTampil(JUMLAH_AWAL)
    setPencarian('')
  }
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url('https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600')",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-16 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-extrabold mb-6">{t.hero.title}</h1>
          <div className="max-w-5xl mx-auto text-left">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-navy-900 text-center mb-2">{t.wilayah.judul}</h2>
        <p className="text-center text-gray-500 text-sm max-w-2xl mx-auto mb-8">{t.wilayah.deskripsi}</p>

        <div className="max-w-xl mx-auto relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
            placeholder={t.wilayah.cariProvinsi}
            className="w-full border rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-navy-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1 space-y-4">
            <div className="card p-3">
              <p className="text-xs font-bold text-gray-400 px-2 py-1 tracking-wide">
                {t.wilayah.provinsiPopuler.toUpperCase()}
              </p>
              <nav className="space-y-1">
                {provinsiPopuler.map((p) => (
                  <button
                    key={p}
                    onClick={() => pilihProvinsi(p)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${provinsiAktif === p ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-gray-50'}`}
                  >
                    {p}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-navy-900 rounded-xl p-4 text-white">
              <p className="text-2xl font-extrabold">{totalTerminalAktif}</p>
              <p className="text-xs text-white/70 mt-1">{t.wilayah.totalTerminalAktif}</p>
            </div>
          </aside>

          <div className="md:col-span-3">
            <div className="card flex items-center gap-4 mb-6">
              <img src={wilayah.gambar} alt={provinsiAktif} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div>
                <h3 className="font-bold text-navy-900">{provinsiAktif}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {wilayah.jumlahKota} {t.wilayah.jumlahKota} ·{' '}
                  {wilayah.jumlahTerminal} {t.wilayah.jumlahTerminal}
                </p>
              </div>
            </div>

            {kotaDitampilkan.length === 0 && <p className="text-sm text-gray-500">{t.wilayah.tidakDitemukan}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kotaDitampilkan.map((k) => (
                <div key={k.nama} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-navy-900">{k.nama}</h4>
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      {k.terminals.length} {t.wilayah.jumlahTerminal}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {k.terminals.map((term) => (
                      <div key={term.nama} className="text-sm border-t first:border-t-0 pt-3 first:pt-0">
                        <p className="text-xs text-gray-400">{term.kecamatan}</p>
                        <p className="font-semibold text-navy-900">{term.nama}</p>
                        <p className="text-xs text-gray-500">
                          {getTipeTerminalLabel(term.tipe, t)} ·{' '}
                          <AutoText text={term.keterangan} as="span" />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {masihAdaLagi && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setJumlahTampil((j) => j + JUMLAH_AWAL)}
                  className="btn-outline inline-flex items-center gap-1.5 text-sm"
                >
                  Muat Lebih Banyak Wilayah <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
