import React from 'react'

const kebijakan = [
  { judul: 'Perubahan Jadwal', isi: 'Penumpang dapat mengajukan perubahan jadwal keberangkatan maksimal 6 jam sebelum waktu berangkat melalui dashboard akun.' },
  { judul: 'Pembatalan Tiket', isi: 'Pembatalan tiket dikenakan biaya administrasi sesuai kategori bus. Refund diproses dalam 3-7 hari kerja.' },
  { judul: 'Barang Bawaan', isi: 'Setiap penumpang mendapat jatah bagasi maksimal 20kg. Barang berharga sebaiknya dibawa sebagai bagasi kabin.' },
  { judul: 'Keterlambatan', isi: 'Penumpang wajib hadir 30 menit sebelum keberangkatan. Keterlambatan penumpang bukan tanggung jawab SeeBus.' },
  { judul: 'Kesehatan & Keselamatan', isi: 'Seluruh armada dilengkapi standar keselamatan dan diperiksa berkala sebelum melakukan perjalanan.' },
]

export default function KebijakanPerjalanan() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
      <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-8">Kebijakan Perjalanan</h1>
      <div className="space-y-5">
        {kebijakan.map((k) => (
          <div key={k.judul} className="card">
            <h3 className="font-bold text-navy-900 mb-1.5">{k.judul}</h3>
            <p className="text-sm text-gray-500">{k.isi}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
