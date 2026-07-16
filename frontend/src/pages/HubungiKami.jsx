import React, { useState } from 'react'
import { Phone, Mail, MapPin, Send } from 'lucide-react'
import { api } from '../utils/api'

export default function HubungiKami() {
  const [form, setForm] = useState({ nama: '', email: '', pesan: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.kirimPesan(form)
      setSent(true)
      setForm({ nama: '', email: '', pesan: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-3">Hubungi Kami</h1>
        <p className="text-gray-500 mb-8">
          Ada pertanyaan seputar pemesanan atau kerja sama? Kirim pesan, tim kami akan segera merespons.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-navy-900">
            <Phone className="w-5 h-5 text-brand-red" /> +62 812-3456-7890
          </div>
          <div className="flex items-center gap-3 text-sm text-navy-900">
            <Mail className="w-5 h-5 text-brand-red" /> cs@seebus.co.id
          </div>
          <div className="flex items-center gap-3 text-sm text-navy-900">
            <MapPin className="w-5 h-5 text-brand-red" /> Jember, Jawa Timur, Indonesia
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {sent && (
          <div className="text-sm bg-green-50 text-green-700 rounded-lg px-3 py-2">
            Pesan kamu berhasil terkirim ke tim SeeBus. Terima kasih!
          </div>
        )}
        {error && (
          <div className="text-sm bg-red-50 text-brand-red rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-navy-900">Nama</label>
          <input
            required
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-900">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-900">Pesan</label>
          <textarea
            required
            rows={4}
            value={form.pesan}
            onChange={(e) => setForm({ ...form, pesan: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
          />
        </div>
        <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> {loading ? 'Mengirim...' : 'Kirim Pesan'}
        </button>
      </form>
    </div>
  )
}
