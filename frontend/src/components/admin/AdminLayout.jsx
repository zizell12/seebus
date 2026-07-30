import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminHeader from './AdminHeader'
import AdminFooter from './AdminFooter'

// Layout khusus panel admin. Semua route di bawah /admin dibungkus dengan
// ini (bukan <Navbar />/<Footer /> customer) supaya navigasi di dalam panel
// admin selalu tetap berada di halaman admin.
export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AdminFooter />
    </div>
  )
}
