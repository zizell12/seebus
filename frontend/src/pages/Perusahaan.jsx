import React from 'react'
import { Building2, Target, Eye, Award } from 'lucide-react'

export default function Perusahaan() {
  return (
    <div>
      <section className="bg-navy-900 py-14 text-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Tentang SeeBus</h1>
        <p className="text-white/70 max-w-xl mx-auto mt-2 text-sm px-4">
          Perusahaan transportasi darat yang menghadirkan pengalaman perjalanan bus yang aman dan nyaman di Indonesia.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <Eye className="w-8 h-8 text-brand-red mb-3" />
          <h3 className="font-bold text-navy-900 mb-2">Visi</h3>
          <p className="text-sm text-gray-500">
            Menjadi platform pemesanan tiket bus terdepan yang menghubungkan setiap kota di Indonesia.
          </p>
        </div>
        <div className="card">
          <Target className="w-8 h-8 text-brand-red mb-3" />
          <h3 className="font-bold text-navy-900 mb-2">Misi</h3>
          <p className="text-sm text-gray-500">
            Menyediakan layanan pemesanan yang mudah, transparan, dan armada bus yang terawat serta terpercaya.
          </p>
        </div>
        <div className="card">
          <Building2 className="w-8 h-8 text-brand-red mb-3" />
          <h3 className="font-bold text-navy-900 mb-2">Perusahaan Mitra</h3>
          <p className="text-sm text-gray-500">
            Bekerja sama dengan berbagai perusahaan otobus (PO) terpercaya di seluruh Indonesia.
          </p>
        </div>
        <div className="card">
          <Award className="w-8 h-8 text-brand-red mb-3" />
          <h3 className="font-bold text-navy-900 mb-2">Komitmen Kualitas</h3>
          <p className="text-sm text-gray-500">
            Setiap armada mitra melalui proses verifikasi standar keamanan dan kenyamanan.
          </p>
        </div>
      </section>
    </div>
  )
}
