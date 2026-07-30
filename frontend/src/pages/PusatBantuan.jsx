import React, { useState } from 'react'
import { Ticket, CreditCard, RotateCcw, Headphones, Search, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import backgroundBantuan from '../assets/background-db.png'
import fotoMitra from '../assets/map-kantor.jpg'
const kategoriIcons = [Ticket, CreditCard, RotateCcw, Headphones]
function KategoriCard({ icon: Icon, judul, desk }) {
  return (
    <div className="card text-center">
      <div className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-brand-red" />
      </div>
      <h3 className="font-semibold text-navy-900 text-sm mb-1">{judul}</h3>
      <p className="text-xs text-gray-500">{desk}</p>
    </div>
  )
}
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <span className="text-sm font-medium text-navy-900">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-500 mt-3">{a}</p>}
    </div>
  )
}
export default function PusatBantuan() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const faqList = t.pusatBantuanPage.faq
  const faqTersaring = query.trim()
    ? faqList.filter(
        (f) =>
          f.q.toLowerCase().includes(query.trim().toLowerCase()) ||
          f.a.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : faqList
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgroundBantuan})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">{t.pusatBantuanPage.heroJudul}</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm mb-6">{t.pusatBantuanPage.heroDeskripsi}</p>
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.pusatBantuanPage.placeholderCari}
              className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.pusatBantuanPage.kategori.map((k, i) => (
            <KategoriCard key={k.judul} icon={kategoriIcons[i]} {...k} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-14 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-navy-900 mb-1">{t.pusatBantuanPage.faqJudul}</h2>
          <p className="text-sm text-gray-500 mb-6">{t.pusatBantuanPage.faqDeskripsi}</p>
          <div className="space-y-3">
            {faqTersaring.length === 0 ? (
              <p className="text-sm text-gray-500">{t.pusatBantuanPage.tidakDitemukan}</p>
            ) : (
              faqTersaring.map((f) => <FaqItem key={f.q} {...f} />)
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden self-start">
          <img src={fotoMitra} alt={t.pusatBantuanPage.altFotoMitra} className="w-full h-36 object-cover" />
          <div className="p-4">
            <p className="text-xs text-brand-teal font-semibold mb-1">{t.pusatBantuanPage.kemitraanLabel}</p>
            <h3 className="font-semibold text-navy-900 text-sm mb-1">{t.pusatBantuanPage.kemitraanJudul}</h3>
            <p className="text-xs text-gray-500">{t.pusatBantuanPage.kemitraanDeskripsi}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
