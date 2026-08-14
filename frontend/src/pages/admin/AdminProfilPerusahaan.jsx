import React, { useEffect, useState } from 'react'
import { Building2, MapPin, ShieldCheck, Phone } from 'lucide-react'
import { api } from '../../utils/api'
import { useLanguage } from '../../context/LanguageContext'

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900/20'

export default function AdminProfilPerusahaan() {
  const { t } = useLanguage()
  const p = t.adminProfilPage

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('umum') // umum | halaman | kontak

  useEffect(() => {
    api
      .getAdminCompanyProfile()
      .then(setForm)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      await api.ubahCompanyProfile(form)
      setNotice(p.berhasilSimpan)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !form) {
    return <div className="p-6 text-sm text-gray-400">{p.memuat}</div>
  }

  const tabs = [
    { key: 'umum', label: p.tabUmum, icon: Building2 },
    { key: 'halaman', label: p.tabHalamanPerusahaan, icon: ShieldCheck },
    { key: 'kontak', label: p.tabKontakLokasi, icon: MapPin },
  ]

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">{p.judul}</h1>
      <p className="text-sm text-gray-500 mb-6">{p.deskripsi}</p>

      <div className="flex gap-1.5 mb-5 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {tab === 'umum' && (
          <>
            <Field label={p.labelNamaPerusahaan}>
              <input required value={form.co_name || ''} onChange={set('co_name')} className={inputClass} />
            </Field>
            <Field label={p.labelBadge}>
              <input value={form.co_badge_sejak || ''} onChange={set('co_badge_sejak')} className={inputClass} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={p.labelStatArmada}>
                <input value={form.co_stat_armada || ''} onChange={set('co_stat_armada')} className={inputClass} />
              </Field>
              <Field label={p.labelStatRute}>
                <input value={form.co_stat_rute || ''} onChange={set('co_stat_rute')} className={inputClass} />
              </Field>
              <Field label={p.labelStatPenumpang}>
                <input value={form.co_stat_penumpang || ''} onChange={set('co_stat_penumpang')} className={inputClass} />
              </Field>
            </div>
          </>
        )}

        {tab === 'halaman' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelHeroJudulId}>
                <input value={form.co_hero_judul_id || ''} onChange={set('co_hero_judul_id')} className={inputClass} />
              </Field>
              <Field label={p.labelHeroJudulEn}>
                <input value={form.co_hero_judul_en || ''} onChange={set('co_hero_judul_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelHeroDeskripsiId}>
                <textarea rows={3} value={form.co_hero_deskripsi_id || ''} onChange={set('co_hero_deskripsi_id')} className={inputClass} />
              </Field>
              <Field label={p.labelHeroDeskripsiEn}>
                <textarea rows={3} value={form.co_hero_deskripsi_en || ''} onChange={set('co_hero_deskripsi_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelMisiId}>
                <textarea rows={2} value={form.co_misi_kutipan_id || ''} onChange={set('co_misi_kutipan_id')} className={inputClass} />
              </Field>
              <Field label={p.labelMisiEn}>
                <textarea rows={2} value={form.co_misi_kutipan_en || ''} onChange={set('co_misi_kutipan_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelAmanJudulId}>
                <input value={form.co_aman_judul_id || ''} onChange={set('co_aman_judul_id')} className={inputClass} />
              </Field>
              <Field label={p.labelAmanJudulEn}>
                <input value={form.co_aman_judul_en || ''} onChange={set('co_aman_judul_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelAmanDeskripsiId}>
                <textarea rows={2} value={form.co_aman_deskripsi_id || ''} onChange={set('co_aman_deskripsi_id')} className={inputClass} />
              </Field>
              <Field label={p.labelAmanDeskripsiEn}>
                <textarea rows={2} value={form.co_aman_deskripsi_en || ''} onChange={set('co_aman_deskripsi_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelKomitmenJudulId}>
                <input value={form.co_komitmen_judul_id || ''} onChange={set('co_komitmen_judul_id')} className={inputClass} />
              </Field>
              <Field label={p.labelKomitmenJudulEn}>
                <input value={form.co_komitmen_judul_en || ''} onChange={set('co_komitmen_judul_en')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelKomitmenDeskripsiId}>
                <textarea rows={2} value={form.co_komitmen_deskripsi_id || ''} onChange={set('co_komitmen_deskripsi_id')} className={inputClass} />
              </Field>
              <Field label={p.labelKomitmenDeskripsiEn}>
                <textarea rows={2} value={form.co_komitmen_deskripsi_en || ''} onChange={set('co_komitmen_deskripsi_en')} className={inputClass} />
              </Field>
            </div>
          </>
        )}

        {tab === 'kontak' && (
          <>
            <Field label={p.labelAlamat}>
              <input value={form.co_address || ''} onChange={set('co_address')} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelTelepon}>
                <input value={form.co_phone || ''} onChange={set('co_phone')} className={inputClass} />
              </Field>
              <Field label={p.labelTeleponCs}>
                <input value={form.co_cs_phone || ''} onChange={set('co_cs_phone')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelWhatsapp}>
                <input value={form.co_whatsapp || ''} onChange={set('co_whatsapp')} className={inputClass} />
              </Field>
              <Field label={p.labelEmail}>
                <input type="email" value={form.co_email || ''} onChange={set('co_email')} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={p.labelMapLat}>
                <input type="number" step="any" value={form.co_map_lat ?? ''} onChange={set('co_map_lat')} className={inputClass} />
              </Field>
              <Field label={p.labelMapLng}>
                <input type="number" step="any" value={form.co_map_lng ?? ''} onChange={set('co_map_lng')} className={inputClass} />
              </Field>
            </div>
            {form.co_map_lat && form.co_map_lng && (
              <a
                href={`https://www.google.com/maps?q=${form.co_map_lat},${form.co_map_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" /> Lihat di Google Maps
              </a>
            )}
          </>
        )}

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        {notice && <p className="text-xs font-semibold text-brand-teal">{notice}</p>}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-red px-5 py-2.5 rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
          >
            <Phone className="w-4 h-4" /> {submitting ? p.menyimpan : p.simpan}
          </button>
        </div>
      </form>
    </div>
  )
}