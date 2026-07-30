import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useLanguage } from '../context/LanguageContext'

// Bungkus halaman admin manapun dengan komponen ini supaya cuma bisa
// diakses kalau user sudah login DAN usr_role-nya admin. Contoh pakai:
//
//   <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
//
export default function RequireAdmin({ children }) {
  const { t } = useLanguage()
  const [status, setStatus] = useState('checking') // checking | allowed | denied

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem('token')
      if (!token) {
        setStatus('denied')
        return
      }
      try {
        const { data: user } = await api.getMe()
        setStatus(user?.usr_role === 'admin' ? 'allowed' : 'denied')
      } catch {
        setStatus('denied')
      }
    }
    verify()
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400 text-sm">
        {t.masukPage.memeriksaAkses}
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/masuk" replace />
  }

  return children
}
