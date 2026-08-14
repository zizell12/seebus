import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, ExternalLink, LogOut } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

// Topbar tipis di panel admin. Navigasi menu (Pesan Kontak, Jadwal Bus, dst)
// sudah dipindah ke <AdminSidebar />; topbar ini cuma menyisakan tombol buka
// sidebar (mobile), "Lihat Situs", dan "Keluar" supaya selalu terlihat di
// halaman admin manapun.
export default function AdminHeader({ onToggleSidebar }) {
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700"
          aria-label={t.adminLayout.bukaMenu}
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        <span className="sm:hidden font-extrabold text-navy-900">{t.adminLayout.brand}</span>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
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
    </header>
  )
}