import React from 'react'
import { useParams, Link } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import { kotaWisataPopuler } from '../data/dummyData'
import { useLanguage } from '../context/LanguageContext'
import backgrounddb from '../assets/background-db.png'
function TempatWisataCard({ nama, gambar, desk }) {
  return (
    <div className="card flex gap-4 items-center">
      <img src={gambar} alt={nama} className="w-24 h-24 rounded-xl object-cover shrink-0" />
      <div>
        <h3 className="font-bold text-navy-900 mb-1">{nama}</h3>
        <p className="text-sm text-gray-500">{desk}</p>
      </div>
    </div>
  )
}
export default function WisataDetail() {
  const { t, lang } = useLanguage()
  const { slug } = useParams()
  const kota = kotaWisataPopuler.find((k) => k.slug === slug)
  if (!kota) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-center">
        <p className="text-gray-500">{t.wisataDetailPage.tidakDitemukan}</p>
        <Link to="/" className="text-brand-red text-sm font-medium">
          {t.wisataDetailPage.kembaliBeranda}
        </Link>
      </div>
    )
  }
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgrounddb})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-24">
          <div className="text-left">
            <h1 className="text-white text-3xl md:text-4xl font-extrabold mb-3 md:whitespace-nowrap">{t.hero.title}</h1>
            <p className="text-white/80 max-w-xl mb-10 text-sm md:text-base">{t.hero.subtitle}</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-red mb-6">{kota.nama}</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <img src={kota.gambar} alt={kota.nama} className="w-full h-64 object-cover rounded-xl" />
          <img src={kota.gambarKedua} alt={kota.nama} className="w-full h-64 object-cover rounded-xl" />
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-bold text-navy-900 mb-3">{t.wisataDetailPage.deskripsiJudul}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{kota.deskripsi[lang]}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy-900 mb-6">
            {t.wisataDetailPage.wajibDikunjungi.replace('{kota}', kota.nama)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kota.tempatWisata?.map((tw) => (
              <TempatWisataCard key={tw.nama} nama={tw.nama} gambar={tw.gambar} desk={tw.desk[lang]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
