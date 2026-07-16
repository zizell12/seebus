import React from 'react'
import { Link } from 'react-router-dom'
import { Bus } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 text-navy-900 font-extrabold text-xl mb-3">
            <Bus className="w-6 h-6 text-brand-red" />
            SeeBus
          </div>
          <p className="text-sm text-gray-500 max-w-xs">
            Transportasi bus terbaik di Indonesia. Perjalanan mudah, cepat, dan aman.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-navy-900 mb-3">FITUR</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-navy-900">Tentang Kami</Link></li>
            <li><Link to="/" className="hover:text-navy-900">Booking Tiket</Link></li>
            <li><Link to="/kebijakan-perjalanan" className="hover:text-navy-900">Kebijakan Perjalanan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-navy-900 mb-3">PLATFORM</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/hubungi-kami" className="hover:text-navy-900">Hubungi Kami</Link></li>
            <li><Link to="/pusat-bantuan" className="hover:text-navy-900">Pusat Bantuan</Link></li>
            <li><Link to="/dashboard/syarat-ketentuan" className="hover:text-navy-900">Syarat &amp; Ketentuan</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-gray-400">
        ©2026 SeeBus. All Rights Reserved.
      </div>
    </footer>
  )
}
