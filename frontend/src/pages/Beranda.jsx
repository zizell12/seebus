import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Route, ShieldCheck, ChevronRight, ChevronLeft, Search, ListChecks, CreditCard } from 'lucide-react'
import SearchForm from '../components/SearchForm'
import { kotaWisataPopuler } from '../data/dummyData'
import { useLanguage } from '../context/LanguageContext'

export default function Beranda() {
  const { t } = useLanguage()
  const scrollRef = useRef(null)

  const scroll = (arah) => {
    scrollRef.current?.scrollBy({ left: arah * 320, behavior: 'smooth' })
  }

  const keunggulan = [
    { icon: <Ticket className="w-5 h-5 text-white" />, judul: t.keunggulan.item1Judul, desk: t.keunggulan.item1Desk },
    { icon: <Route className="w-5 h-5 text-white" />, judul: t.keunggulan.item2Judul, desk: t.keunggulan.item2Desk },
    { icon: <ShieldCheck className="w-5 h-5 text-white" />, judul: t.keunggulan.item3Judul, desk: t.keunggulan.item3Desk },
  ]

  const langkah = [
    { icon: <Search className="w-5 h-5 text-brand-red" />, judul: t.caraKerja.langkah1Judul, desk: t.caraKerja.langkah1Desk },
    { icon: <ListChecks className="w-5 h-5 text-brand-red" />, judul: t.caraKerja.langkah2Judul, desk: t.caraKerja.langkah2Desk },
    { icon: <CreditCard className="w-5 h-5 text-brand-red" />, judul: t.caraKerja.langkah3Judul, desk: t.caraKerja.langkah3Desk },
  ]

  return (
    <div>
      {/* Hero */}
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url('https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600')" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-24 text-left">
          <h1 className="text-white text-3xl md:text-4xl font-extrabold mb-3 max-w-2xl">
            {t.hero.title}
          </h1>
          <p className="text-white/80 max-w-xl mb-10 text-sm md:text-base">
            {t.hero.subtitle}
          </p>

          <div className="max-w-5xl text-left">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Kenapa memilih SeeBus */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <h2 className="section-title mb-10">{t.keunggulan.judul}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {keunggulan.map((k) => (
            <div key={k.judul} className="card">
              <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center mb-4">
                {k.icon}
              </div>
              <h3 className="font-bold text-navy-900 mb-1.5">{k.judul}</h3>
              <p className="text-sm text-gray-500">{k.desk}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kota Wisata Populer — carousel scroll kiri/kanan */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="section-title mb-2">{t.wisata.judul}</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            {t.wisata.deskripsi}
          </p>

          <div className="relative">
            <button
              onClick={() => scroll(-1)}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
            >
              {kotaWisataPopuler.map((k) => (
                <Link
                  to={`/wisata/${k.slug}`}
                  key={k.nama}
                  className="relative rounded-xl overflow-hidden h-64 w-72 shrink-0 group block"
                >
                  <img src={k.gambar} alt={k.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{k.nama}</span>
                    <ChevronRight className="text-white w-5 h-5" />
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll(1)}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
              aria-label="Selanjutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Cara Kerjanya */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <h2 className="section-title mb-10">{t.caraKerja.judul}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {langkah.map((l) => (
            <div key={l.judul} className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                {l.icon}
              </div>
              <h3 className="font-bold text-navy-900 mb-1.5">{l.judul}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">{l.desk}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
