import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

// Footer khusus panel admin, sengaja dibuat sangat minim (tanpa link-link
// customer seperti destinasi/perusahaan/dsb) supaya tidak membawa admin
// keluar dari konteks panel admin.
export default function AdminFooter() {
  const { t } = useLanguage()
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between text-xs text-gray-400">
        <span>{t.adminLayout.footerText}</span>
        <span>© {new Date().getFullYear()} SeeBus</span>
      </div>
    </footer>
  )
}
