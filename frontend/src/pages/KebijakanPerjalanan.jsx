import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Luggage, ClipboardList, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
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
  const { t } = useLanguage()
  const k = t.kebijakanPage
  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgroundKebijakan})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">{k.heroJudul}</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm">{k.heroDeskripsi}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">{k.keselamatanJudul}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title={k.keselamatanTitle}>
              <p>{k.keselamatanDesk}</p>
            </InfoCard>
            <InfoCard title={k.kenyamananTitle}>
              <p>{k.kenyamananDesk}</p>
            </InfoCard>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Luggage className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">{k.bagasiJudul}</h2>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">{k.bagasiKategori}</th>
                  <th className="pb-3 font-medium">{k.bagasiKetentuan}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top w-40">{k.bagasiKabinTitle}</td>
                  <td className="py-3 text-gray-500">{k.bagasiKabinDesk}</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top">{k.bagasiUtamaTitle}</td>
                  <td className="py-3 text-gray-500">{k.bagasiUtamaDesk}</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-navy-900 align-top">{k.bagasiTerlarangTitle}</td>
                  <td className="py-3 text-gray-500">{k.bagasiTerlarangDesk}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">{k.checkinJudul}</h2>
          </div>
          <div className="card space-y-5">
            {k.checkinSteps.map((step, i) => (
              <StepItem key={step.title} number={i + 1} title={step.title} desc={step.desc} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-brand-red" />
            <h2 className="font-bold text-navy-900">{k.refundJudul}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title={k.pengembalianDanaTitle}>
              <ul className="list-disc list-inside space-y-1">
                {k.pengembalianDanaItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </InfoCard>
            <InfoCard title={k.perubahanJadwalTitle}>
              <ul className="list-disc list-inside space-y-1">
                {k.perubahanJadwalItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </InfoCard>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-14">
        <div className="bg-navy-900 rounded-xl px-6 md:px-12 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">{k.ctaJudul}</h3>
            <p className="text-white/70 text-sm max-w-md">{k.ctaDeskripsi}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/"
              className="bg-brand-red text-white px-5 py-3 rounded-xl shadow-sm hover:bg-brand-red/90 transition-colors font-medium"
            >
              {k.pesanTiket}
            </Link>
            <Link
              to="/hubungi-kami"
              className="border border-white/30 text-white px-5 py-3 rounded-xl hover:bg-white/10 transition-colors font-medium"
            >
              {t.nav.hubungiKami}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
