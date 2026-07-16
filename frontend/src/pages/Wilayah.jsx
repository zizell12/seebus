import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { kotaList } from '../data/dummyData'

export default function Wilayah() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">Wilayah Layanan</h1>
      <p className="text-gray-500 mb-10 max-w-2xl">
        SeeBus melayani perjalanan antar kota di seluruh Indonesia. Berikut kota-kota yang sudah terhubung dengan armada kami.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {kotaList.map((kota) => (
          <Link
            key={kota}
            to="/pencarian"
            className="card flex items-center gap-3 hover:border-brand-red transition-colors"
          >
            <MapPin className="w-5 h-5 text-brand-red shrink-0" />
            <span className="font-semibold text-navy-900 text-sm">{kota}</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        * Daftar wilayah ini nantinya diambil dari API Laravel <code>GET /api/wilayah</code>.
      </p>
    </div>
  )
}
