import React from 'react'
import { Link } from 'react-router-dom'
import { Bus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 text-navy-900 font-extrabold text-xl mb-3">
            <Bus className="w-6 h-6 text-brand-red" />
            SeeBus
          </div>
          <p className="text-sm text-gray-500 max-w-xs">
            {t.footer.deskripsi}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-navy-900 mb-3">{t.footer.fiturJudul}</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-navy-900">{t.footer.tentangKami}</Link></li>
            <li><Link to="/" className="hover:text-navy-900">{t.footer.bookingTiket}</Link></li>
            <li><Link to="/kebijakan-perjalanan" className="hover:text-navy-900">{t.footer.kebijakanPerjalanan}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-navy-900 mb-3">{t.footer.platformJudul}</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/hubungi-kami" className="hover:text-navy-900">{t.footer.hubungiKami}</Link></li>
            <li><Link to="/pusat-bantuan" className="hover:text-navy-900">{t.footer.pusatBantuan}</Link></li>
            <li><Link to="/dashboard/syarat-ketentuan" className="hover:text-navy-900">{t.footer.syaratKetentuan}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-gray-400">
        {t.footer.copyright}
      </div>
    </footer>
  )
}
