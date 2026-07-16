import React, { useState } from 'react'
import { User, Ticket, Clock, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

const tabs = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'tiket', label: 'Tiket Saya', icon: Ticket },
  { id: 'riwayat', label: 'Riwayat Pesanan', icon: Clock },
]

// Contoh data — nanti diganti fetch dari Laravel: GET /api/user, GET /api/pesanan
const riwayatDummy = [
  { kode: 'SB-42093812', rute: 'Jember → Bali', tanggal: '2026-07-20', status: 'Terjadwal' },
  { kode: 'SB-40218233', rute: 'Malang → Surabaya', tanggal: '2026-06-02', status: 'Selesai' },
]

export default function DashboardCustomer() {
  const [active, setActive] = useState('profil')

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="card h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">R</div>
          <div>
            <p className="font-bold text-navy-900 text-sm">Nama Customer</p>
            <p className="text-xs text-gray-400">customer@email.com</p>
          </div>
        </div>
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === t.id ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
          <Link to="/" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-red hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Keluar
          </Link>
        </nav>
      </aside>

      <section className="md:col-span-3">
        {active === 'profil' && (
          <div className="card">
            <h2 className="font-bold text-navy-900 mb-4">Profil Saya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Nama</p><p className="font-medium text-navy-900">Nama Customer</p></div>
              <div><p className="text-gray-400">Email</p><p className="font-medium text-navy-900">customer@email.com</p></div>
              <div><p className="text-gray-400">No. Telepon</p><p className="font-medium text-navy-900">0812-3456-7890</p></div>
              <div><p className="text-gray-400">Bergabung Sejak</p><p className="font-medium text-navy-900">Juli 2026</p></div>
            </div>
            <button className="btn-outline mt-6 text-sm">Edit Profil</button>
          </div>
        )}

        {active === 'tiket' && (
          <div className="space-y-4">
            {riwayatDummy.filter(r => r.status === 'Terjadwal').map((r) => (
              <div key={r.kode} className="card flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy-900">{r.rute}</p>
                  <p className="text-xs text-gray-400">{r.kode} · {r.tanggal}</p>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {active === 'riwayat' && (
          <div className="space-y-4">
            {riwayatDummy.map((r) => (
              <div key={r.kode} className="card flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy-900">{r.rute}</p>
                  <p className="text-xs text-gray-400">{r.kode} · {r.tanggal}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.status === 'Selesai' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
