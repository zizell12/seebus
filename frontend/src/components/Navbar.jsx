import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X, Bus, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { lang, setLang, t } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menu = [
    { to: '/', label: t.nav.beranda },
    { to: '/wilayah', label: t.nav.wilayah },
    { to: '/perusahaan', label: t.nav.perusahaan },
    { to: '/hubungi-kami', label: t.nav.hubungiKami },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-navy-900 font-extrabold text-xl">
          <Bus className="w-6 h-6 text-brand-red" />
          SeeBus
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium pb-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-navy-900 border-brand-red'
                    : 'text-gray-500 border-transparent hover:text-navy-900'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {/* Tombol ganti bahasa */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 text-sm font-semibold text-navy-900 border rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
            >
              {lang.toUpperCase()} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg border overflow-hidden">
                {['id', 'en'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      lang === l ? 'font-bold text-brand-red' : 'text-navy-900'
                    }`}
                  >
                    {l === 'id' ? 'Indonesia' : 'English'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Masuk/Daftar dihapus — situs publik ini tidak butuh login,
              cuma admin yang login lewat halaman admin panel terpisah nanti. */}
        </div>

        <button className="md:hidden text-navy-900" onClick={() => setOpen(!open)} aria-label="Buka menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-navy-900 font-medium"
            >
              {m.label}
            </NavLink>
          ))}

          <div className="flex gap-2 pt-2">
            {['id', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 text-sm py-1.5 rounded-lg border ${
                  lang === l ? 'bg-navy-900 text-white' : 'text-navy-900'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
