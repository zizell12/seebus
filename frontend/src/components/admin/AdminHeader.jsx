import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Inbox, CalendarClock, ExternalLink, LogOut } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

// Header khusus panel admin. Sengaja dipisah dari <Navbar /> milik customer
// supaya link-link di dalamnya (Pesan Kontak, Jadwal Bus, dst) selalu
// mengarah ke halaman admin lain, bukan ke halaman customer yang bikin
// admin "terjebak" harus klik tombol kembali di pojok kiri atas.
export default function AdminHeader() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // abaikan, tetap logout di sisi klien
    } finally {
      localStorage.removeItem('token')
      navigate('/masuk')
    }
  }

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/admin" className="font-extrabold text-navy-900 text-lg shrink-0">
            {t.adminLayout.brand}
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/admin" end className={navLinkClass}>
              <Inbox className="w-4 h-4" /> {t.adminLayout.menuPesan}
            </NavLink>
            <NavLink to="/admin/jadwal" className={navLinkClass}>
              <CalendarClock className="w-4 h-4" /> {t.adminLayout.menuJadwal}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> {t.adminLayout.lihatSitus}
          </a>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> {t.adminLayout.keluar}
          </button>
        </div>
      </div>

      <nav className="sm:hidden flex items-center gap-1 px-4 pb-3">
        <NavLink to="/admin" end className={navLinkClass}>
          <Inbox className="w-4 h-4" /> {t.adminLayout.menuPesan}
        </NavLink>
        <NavLink to="/admin/jadwal" className={navLinkClass}>
          <CalendarClock className="w-4 h-4" /> {t.adminLayout.menuJadwal}
        </NavLink>
      </nav>
    </header>
  )
}
