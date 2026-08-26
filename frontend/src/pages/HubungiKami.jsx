import React, { useState } from 'react'
import { Phone, Mail, MessageCircle, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import kantorPusat from '../assets/map-kantor.jpg'
import { api } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'

function ContactChannel({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-navy-900/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-teal" />
      </div>

      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-navy-900">{value}</p>
      </div>
    </div>
  )
}

export default function HubungiKami() {
  const { t } = useLanguage()

  const [form, setForm] = useState({
    nama: '',
    email: '',
    subjek: 'Pertanyaan Umum',
    pesan: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState(false)

  // Info kontak di halaman ini SENGAJA ditulis langsung di kode (bukan
  // diambil dari database lewat panel admin) -- kontennya jarang berubah,
  // jadi lebih simpel diedit langsung di sini kalau suatu saat perlu
  // diganti, daripada lewat form admin yang jarang dipakai.
  const alamat = t.hubungiKamiPage.kantorPusatAlamat
  const teleponCs = '+62 21 555 1234'
  const email = 'support@seebus.co.id'
  const whatsapp = '+62 812 3456 7890'
  const mapLink = 'https://www.google.com/maps?q=-6.2241,106.8022'

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSukses(false)

    try {
      await api.kirimPesan({
        nama: form.nama,
        email: form.email,
        subjek: form.subjek,
        pesan: form.pesan,
      })

      setSukses(true)

      setForm({
        nama: '',
        email: '',
        subjek: 'Pertanyaan Umum',
        pesan: '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* HERO */}
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(
            rgba(11,30,77,0.8),
            rgba(11,30,77,0.7)
          ), url(${kantorPusat})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">
            {t.hubungiKamiPage.heroJudul}
          </h1>

          <p className="text-white/80 max-w-xl mx-auto text-sm">
            {t.hubungiKamiPage.heroDeskripsi}
          </p>
        </div>
      </section>

      {/* FORM + CONTACT INFORMATION */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* FORM KONTAK */}
        <form
          onSubmit={handleSubmit}
          className="card md:col-span-2"
        >
          <h2 className="text-lg font-bold text-navy-900 mb-6">
            {t.hubungiKamiPage.formJudul}
          </h2>

          {/* SUCCESS MESSAGE */}
          {sukses && (
            <p className="text-sm text-green-600 mb-4">
              {t.hubungiKamiPage.suksesPesan}
            </p>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <p className="text-sm text-brand-red mb-4">
              {error}
            </p>
          )}

          {/* NAMA + EMAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* NAMA */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {t.hubungiKamiPage.labelNama}
              </label>

              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder={t.hubungiKamiPage.placeholderNama}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {t.hubungiKamiPage.labelEmail}
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t.hubungiKamiPage.placeholderEmail}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* SUBJEK */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">
              {t.hubungiKamiPage.labelSubjek}
            </label>

            <select
              name="subjek"
              value={form.subjek}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            >
              <option value="Pertanyaan Umum">
                {t.hubungiKamiPage.subjekUmum}
              </option>

              <option value="Pemesanan Tiket">
                {t.hubungiKamiPage.subjekPemesanan}
              </option>

              <option value="Pembayaran">
                {t.hubungiKamiPage.subjekPembayaran}
              </option>

              <option value="Kerja Sama">
                {t.hubungiKamiPage.subjekKerjaSama}
              </option>
            </select>
          </div>

          {/* PESAN */}
          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1.5">
              {t.hubungiKamiPage.labelPesan}
            </label>

            <textarea
              name="pesan"
              value={form.pesan}
              onChange={handleChange}
              rows={5}
              placeholder={t.hubungiKamiPage.placeholderPesan}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 resize-none"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-red text-white px-5 py-3 rounded-xl shadow-sm hover:bg-brand-red/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? t.hubungiKamiPage.tombolMengirim
              : t.hubungiKamiPage.tombolKirim}
          </button>
        </form>

        {/* SIDEBAR KANAN */}
        <div className="space-y-6">

          {/* CONTACT INFORMATION */}
          <div className="card">
            <h2 className="text-sm font-bold text-navy-900 mb-4">
              {t.hubungiKamiPage.sisiJudul}
            </h2>

            <div className="space-y-4">

              {/* TELEPON */}
              <ContactChannel
                icon={Phone}
                label={t.hubungiKamiPage.labelCs}
                value={teleponCs}
              />

              {/* EMAIL */}
              <ContactChannel
                icon={Mail}
                label={t.hubungiKamiPage.labelEmailDukungan}
                value={email}
              />

              {/* WHATSAPP */}
              <ContactChannel
                icon={MessageCircle}
                label={t.hubungiKamiPage.labelWhatsapp}
                value={whatsapp}
              />

              {/* PROMO / INFO */}
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                {t.hubungiKamiPage.promoText}
              </p>
            </div>
          </div>

          {/* GOOGLE MAPS */}
          <div className="card">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
            >
              <img
                src={kantorPusat}
                alt={t.hubungiKamiPage.kantorPusatLabel}
                className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity"
              />

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />

              {/* MAP INFORMATION */}
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-white font-semibold text-sm">
                  {t.hubungiKamiPage.kantorPusatLabel}
                </p>

                <p className="text-white/70 text-xs">
                  {alamat}
                </p>

                <span className="text-brand-red text-xs font-medium">
                  {t.hubungiKamiPage.lihatGoogleMaps}
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* HELP CENTER */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-14">
        <div className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          {/* TEXT */}
          <div>
            <h3 className="font-bold text-navy-900 mb-1">
              {t.hubungiKamiPage.bantuanJudul}
            </h3>

            <p className="text-sm text-gray-500 max-w-xl">
              {t.hubungiKamiPage.bantuanDeskripsi}
            </p>
          </div>

          {/* BUTTON */}
          <Link
            to="/pusat-bantuan"
            className="flex items-center gap-2 bg-navy-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-navy-800 transition-colors shrink-0"
          >
            <HelpCircle size={18} />

            {t.hubungiKamiPage.kunjungiPusatBantuan}
          </Link>
        </div>
      </section>
    </div>
  )
}