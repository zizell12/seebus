import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import AdminFooter from './AdminFooter'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Default tertutup di mobile (biar konten nggak ketutup), terbuka di desktop.
    if (window.innerWidth < 640) setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  )
}