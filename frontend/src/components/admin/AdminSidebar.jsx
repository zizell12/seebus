import React from 'react'
import { NavLink } from 'react-router-dom'
import { Inbox, CalendarClock, BusFront, X, Route as RouteIcon, MapPin } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const MENU_GROUPS = [
  {
    key: 'operasional',
    items: [
      { to: '/admin', end: true, icon: Inbox, labelKey: 'menuPesan' },
      { to: '/admin/jadwal', end: false, icon: CalendarClock, labelKey: 'menuJadwal' },
      { to: '/admin/tipe-bus', end: false, icon: BusFront, labelKey: 'menuTipeBus' },
      { to: '/admin/rute', end: false, icon: RouteIcon, labelKey: 'menuRute' },
      { to: '/admin/terminal', end: false, icon: MapPin, labelKey: 'menuTerminal' },
    ],
  },
]

export default function AdminSidebar({ open, onClose }) {
  const { t } = useLanguage()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors ${
      isActive ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-100'
    }`

  const content = (
    <div className="flex flex-col h-full w-72 sm:w-64">
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 shrink-0">
        <span className="font-extrabold text-navy-900 text-lg">{t.adminLayout.brand}</span>
        <button onClick={onClose} className="sm:hidden text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {MENU_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="px-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t.adminLayout.groupOperasional}
            </p>
            <div className="space-y-1">
              {group.items.map(({ to, end, icon: Icon, labelKey }) => (
                <NavLink key={to} to={to} end={end} className={linkClass} onClick={onClose}>
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {t.adminLayout[labelKey]}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Overlay gelap, cuma muncul di mobile saat sidebar terbuka */}
      {open && (
        <div className="sm:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}

      {/* Sidebar: off-canvas (slide) di mobile, collapse lebar di desktop */}
      <aside
        className={`fixed sm:sticky top-0 left-0 h-screen z-50 sm:z-auto bg-white border-r border-gray-200
          transition-all duration-200 ease-in-out overflow-hidden
          ${open ? 'translate-x-0 sm:w-64' : '-translate-x-full sm:translate-x-0 sm:w-0 sm:border-r-0'}`}
      >
        {content}
      </aside>
    </>
  )
}