import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faq = [
  { q: 'Bagaimana cara memesan tiket bus?', a: 'Isi kota asal, tujuan, dan tanggal di halaman Beranda, lalu pilih bus, kursi, isi data penumpang dan lakukan pembayaran.' },
  { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Saat ini SeeBus mendukung pembayaran melalui PayPal. Metode lain akan segera menyusul.' },
  { q: 'Apakah tiket bisa dibatalkan?', a: 'Bisa, melalui menu Dashboard > Riwayat Pesanan, mengikuti kebijakan perjalanan yang berlaku.' },
  { q: 'Bagaimana jika e-tiket tidak muncul di email?', a: 'E-tiket juga tersimpan otomatis di Dashboard akun kamu pada bagian Tiket Saya.' },
]

export default function PusatBantuan() {
  const [openIdx, setOpenIdx] = useState(null)
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
      <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-8 text-center">Pusat Bantuan</h1>
      <div className="space-y-3">
        {faq.map((f, i) => (
          <div key={f.q} className="card">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span className="font-semibold text-navy-900 text-sm">{f.q}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === i && <p className="text-sm text-gray-500 mt-3">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
