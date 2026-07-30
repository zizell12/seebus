import React from 'react'
import {
  Search,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

import backgroundPerusahaan from '../assets/background-db.png'
import ceoImage from '../assets/ceo.jpg'
import mapKantor from '../assets/map-kantor.jpg'

function MapPreview({ image, link, alt }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <img
        src={image}
        alt={alt}
        className="w-full h-64 object-cover group-hover:opacity-90 transition-opacity"
      />
    </a>
  )
}

function ContactItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-navy-900/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-red" />
      </div>

      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-navy-900 font-medium">{value}</p>
      </div>
    </div>
  )
}

function StatItem({ value, label }) {
  return (
    <div className="bg-gray-50 rounded-xl py-6 text-center">
      <p className="text-2xl font-bold text-brand-red">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function MissionSection({ t }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            {t.perusahaan.misiJudul}
          </h2>

          <p className="text-gray-600 italic mb-6">
            {t.perusahaan.misiKutipan}
          </p>

          <div className="flex items-center gap-3">
            <img
              src={ceoImage}
              alt="Susilo Wijayanto"
              className="w-14 h-14 rounded-full object-cover"
            />

            <div>
              <p className="text-sm font-semibold text-navy-900">
                Susilo Wijayanto
              </p>

              <p className="text-xs text-gray-400">@seebus</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-900 rounded-xl p-8 flex flex-col justify-center">
          <ShieldCheck className="w-8 h-8 text-white mb-4" />

          <h3 className="text-white font-bold text-lg mb-2">
            {t.perusahaan.perjalananAmanJudul}
          </h3>

          <p className="text-white/70 text-sm">
            {t.perusahaan.perjalananAmanDeskripsi}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatItem
          value="500+"
          label={t.perusahaan.statArmada}
        />

        <StatItem
          value="120"
          label={t.perusahaan.statRute}
        />

        <StatItem
          value="2 Juta+"
          label={t.perusahaan.statPenumpang}
        />
      </div>
    </section>
  )
}

function CommitmentBanner({ t }) {
  return (
    <section className="bg-navy-900 rounded-xl mx-4 md:mx-8 my-14 px-6 md:px-12 py-14 text-center">
      <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
        {t.perusahaan.komitmenJudul}
      </h2>

      <p className="text-white/70 max-w-xl mx-auto mb-6 text-sm">
        {t.perusahaan.komitmenDeskripsi}
      </p>

      <Link
        to="/kebijakan-perjalanan"
        className="bg-brand-red text-white px-6 py-3 rounded-xl shadow-sm hover:bg-brand-red/90 transition-colors inline-block"
      >
        {t.perusahaan.lihatKebijakan}
      </Link>
    </section>
  )
}

export default function Perusahaan() {
  const { t } = useLanguage()

  return (
    <div>
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,.95), rgba(255,255,255,.4)), url(${backgroundPerusahaan})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-xl">
            <span className="inline-block bg-brand-red text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {t.perusahaan.badgeSejak}
            </span>

            <h1 className="text-navy-900 text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              {t.perusahaan.heroJudul}
            </h1>

            <p className="text-gray-600 mb-6 text-sm md:text-base">
              {t.perusahaan.heroDeskripsi}
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-navy-800 transition-colors"
            >
              <Search size={18} />
              {t.perusahaan.cariJadwal}
            </Link>
          </div>
        </div>
      </section>

      <MissionSection t={t} />

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 mb-6">
            {t.perusahaan.hubungiKamiJudul}
          </h2>

          <div className="space-y-5">
            <ContactItem
              icon={MapPin}
              label={t.perusahaan.labelHeadquarters}
              value={t.perusahaan.alamatKantor}
            />

            <ContactItem
              icon={Phone}
              label={t.perusahaan.labelPhone}
              value="+62 21 555 0192"
            />

            <ContactItem
              icon={Mail}
              label={t.perusahaan.labelEmail}
              value="support@seebus.co.id"
            />
          </div>
        </div>

        <MapPreview
          image={mapKantor}
          link="https://maps.google.com/?q=-6.2241,106.8022"
          alt={t.perusahaan.altPeta}
        />
      </section>

      <CommitmentBanner t={t} />
    </div>
  )
}