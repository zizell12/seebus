import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bus } from 'lucide-react'
import { api } from '../utils/api'

export default function Masuk() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.login(form)
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-14">
      <div className="card w-full max-w-sm">
        <div className="flex items-center gap-2 text-navy-900 font-extrabold text-xl mb-6 justify-center">
          <Bus className="w-6 h-6 text-brand-red" /> SeeBus
        </div>
        <h1 className="text-xl font-bold text-navy-900 mb-1 text-center">Masuk ke Akun</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Kelola pesanan tiket bus kamu dengan mudah.</p>

        {error && <p className="text-sm text-brand-red mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-900">Email</label>
            <input
              type="email" required
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900">Password</label>
            <input
              type="password" required
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-5">
          Belum punya akun? <Link to="/daftar" className="text-brand-red font-semibold">Daftar</Link>
        </p>
        <p className="text-xs text-gray-400 text-center mt-4">
          Coba pakai: <code>customer@seebus.co.id</code> / <code>password123</code> (dari seeder)
        </p>
      </div>
    </div>
  )
}
