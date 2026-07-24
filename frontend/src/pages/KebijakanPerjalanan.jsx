import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Luggage, ClipboardList, RefreshCw } from 'lucide-react'
import backgroundKebijakan from '../assets/background-db.png'
function InfoCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-navy-900 mb-2">{title}</h3>
      <div className="text-sm text-gray-500 space-y-1">{children}</div>
    </div>
  )
}
function StepItem({ number, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-navy-900 text-sm mb-1">{title}</h4>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  )
}
export default function KebijakanPerjalanan() {
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgroundKebijakan})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Kebijakan Perjalanan SeeBus</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm">
            Pelajari syarat, ketentuan, serta kebijakan perjalanan SeeBus untuk memastikan perjalanan Anda aman, nyaman,
            dan sesuai dengan peraturan yang berlaku.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <p className="text-xs text-gray-400">
          <Link to="/perusahaan" className="hover:text-navy-900">
            Perusahaan
          </Link>{' '}
          {'>'} Kebijakan Perjalanan
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">Keselamatan & Kenyamanan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Keselamatan">
              <p>
                Keselamatan penumpang adalah prioritas utama SeeBus. Seluruh perjalanan dikawal armada bus yang
                beroperasi sesuai ketentuan operator, terpasang standar keamanan yang berlaku.
              </p>
            </InfoCard>
            <InfoCard title="Kenyamanan">
              <p>
                SeeBus bekerja sama dengan operator untuk memberikan pengalaman perjalanan yang nyaman, mulai dari
                proses keberangkatan hingga tiba di tujuan.
              </p>
            </InfoCard>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Luggage className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">Kebijakan Bagasi</h2>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Kategori</th>
                  <th className="pb-3 font-medium">Ketentuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top w-40">Bagasi kabin</td>
                  <td className="py-3 text-gray-500">
                    Maksimal 7 kg per penumpang dan harus dapat disimpan dengan aman di kabin.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top">Bagasi utama</td>
                  <td className="py-3 text-gray-500">
                    Mengikuti ketentuan masing-masing operator bus, informal tersedia saat proses pemesanan.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top">Barang Terlarang</td>
                  <td className="py-3 text-gray-500">
                    Dilarang membawa barang berbahaya, bahan mudah terbakar, senjata, narkotika, atau barang lain yang
                    melanggar hukum.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">Panduan Check-in</h2>
          </div>
          <div className="card space-y-5">
            <StepItem
              number={1}
              title="Konfirmasi Tiket"
              desc="Pastikan Anda telah menerima e-tiket melalui email atau atau bisa mengaksesnya melalui akun SeeBus sebelum keberangkatan."
            />
            <StepItem
              number={2}
              title="Waktu Kedatangan"
              desc="Diusahakan tiba di titik keberangkatan minimal 30 menit sebelum jadwal keberangkatan untuk proses pemeriksaan dan boarding."
            />
            <StepItem
              number={3}
              title="Identitas"
              desc="Penumpang wajib membawa kartu identitas yang masih berlaku dan sesuai dengan data yang digunakan saat pemesanan."
            />
            <StepItem
              number={4}
              title="Ketepatan Waktu"
              desc="Operator bus tetap mengizinkan titik keberangkatan sesuai jadwal. Keterlambatan penumpang menjadi tanggung jawab masing-masing."
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">Refund & Reschedule</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Pengembalian Dana">
              <ul className="list-disc list-inside space-y-1">
                <li>{'>'} 24 jam sebelum: Refund 75% dari harga tiket.</li>
                <li>{'<'} 24 jam sebelum: Tiket hangus (tidak ada refund).</li>
                <li>Proses refund memerlukan waktu 7–14 hari kerja.</li>
              </ul>
            </InfoCard>
            <InfoCard title="Perubahan Jadwal">
              <ul className="list-disc list-inside space-y-1">
                <li>Hanya dilakukan satu kali per tiket.</li>
                <li>Biaya admin Rp 20.000 + selisih harga tiket.</li>
                <li>Maksimal 12 jam sebelum jadwal awal.</li>
              </ul>
            </InfoCard>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-14">
        <div className="bg-navy-900 rounded-xl px-6 md:px-12 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Siap Untuk Perjalanan Anda?</h3>
            <p className="text-white/70 text-sm max-w-md">
              Pastikan Anda telah memahami seluruh kebijakan perjalanan sebelum melakukan pemesanan agar perjalanan
              bersama SeeBus berjalan lancar dan nyaman.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/"
              className="bg-brand-red text-white px-5 py-3 rounded-xl shadow-sm hover:bg-brand-red/90 transition-colors font-medium"
            >
              Pesan Tiket
            </Link>
            <Link
              to="/hubungi-kami"
              className="border border-white/30 text-white px-5 py-3 rounded-xl hover:bg-white/10 transition-colors font-medium"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
