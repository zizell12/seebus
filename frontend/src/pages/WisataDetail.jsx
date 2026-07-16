import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { kotaWisataPopuler } from '../data/dummyData'

export default function WisataDetail() {
  const { slug } = useParams()
  const kota = kotaWisataPopuler.find((k) => k.slug === slug)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-navy-900 mb-2">
        {kota ? kota.nama : 'Halaman Wisata'}
      </h1>
      <p className="text-gray-500 mb-6">
        Halaman ini masih placeholder — kirim desain mockup-nya kapan saja,
        nanti kita bangun sesuai itu.
      </p>
      <Link to="/" className="text-brand-red font-semibold hover:underline">
        ← Kembali ke Beranda
      </Link>
    </div>
  )
}
