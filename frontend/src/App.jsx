import React from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Beranda from './pages/Beranda'
import Wilayah from './pages/Wilayah'
import Perusahaan from './pages/Perusahaan'
import HubungiKami from './pages/HubungiKami'
import KebijakanPerjalanan from './pages/KebijakanPerjalanan'
import PusatBantuan from './pages/PusatBantuan'
import Masuk from './pages/Masuk'
import RequireAdmin from './components/RequireAdmin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminJadwal from './pages/admin/AdminJadwal'
import AdminJadwalForm from './pages/admin/AdminJadwalForm'
import AdminJadwalGenerate from './pages/admin/AdminJadwalGenerate'
import AdminTipeBus from './pages/admin/AdminTipeBus'
import AdminTipeBusForm from './pages/admin/AdminTipeBusForm'
import AdminRute from './pages/admin/AdminRute'
import AdminRuteForm from './pages/admin/AdminRuteForm'
import AdminStasiun from './pages/admin/AdminStasiun'
import AdminStasiunForm from './pages/admin/AdminStasiunForm'
import WisataDetail from './pages/WisataDetail'
import HasilPencarian from './pages/booking/HasilPencarian'
import DataPenumpang from './pages/booking/DataPenumpang'
import Pembayaran from './pages/booking/Pembayaran'
import PembayaranBerhasil from './pages/booking/PembayaranBerhasil'
import LanjutkanPembayaran from './pages/booking/LanjutkanPembayaran'

// Layout untuk halaman customer, pakai Navbar & Footer customer seperti biasa.
function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/wilayah" element={<Wilayah />} />
        <Route path="/perusahaan" element={<Perusahaan />} />
        <Route path="/hubungi-kami" element={<HubungiKami />} />
        <Route path="/kebijakan-perjalanan" element={<KebijakanPerjalanan />} />
        <Route path="/pusat-bantuan" element={<PusatBantuan />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/wisata/:slug" element={<WisataDetail />} />

        <Route path="/pencarian" element={<HasilPencarian />} />
        <Route path="/pemesanan/penumpang" element={<DataPenumpang />} />
        <Route path="/pemesanan/pembayaran" element={<Pembayaran />} />
        <Route path="/pemesanan/berhasil" element={<PembayaranBerhasil />} />
        <Route path="/pemesanan/lanjutkan" element={<LanjutkanPembayaran />} />
      </Route>

      {/* Panel admin punya layout sendiri (header & footer khusus
          admin) supaya navigasi di dalamnya selalu tetap di halaman admin,
          tidak nyasar ke halaman customer. */}
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/jadwal" element={<AdminJadwal />} />
        <Route path="/admin/jadwal/tambah" element={<AdminJadwalForm />} />
        <Route path="/admin/jadwal/generate" element={<AdminJadwalGenerate />} />
        <Route path="/admin/jadwal/edit/:id" element={<AdminJadwalForm />} />
        <Route path="/admin/tipe-bus" element={<AdminTipeBus />} />
        <Route path="/admin/tipe-bus/tambah" element={<AdminTipeBusForm />} />
        <Route path="/admin/tipe-bus/edit/:id" element={<AdminTipeBusForm />} />
        <Route path="/admin/rute" element={<AdminRute />} />
        <Route path="/admin/rute/tambah" element={<AdminRuteForm />} />
        <Route path="/admin/rute/edit/:id" element={<AdminRuteForm />} />
        <Route path="/admin/terminal" element={<AdminStasiun />} />
        <Route path="/admin/terminal/tambah" element={<AdminStasiunForm />} />
        <Route path="/admin/terminal/edit/:id" element={<AdminStasiunForm />} />
      </Route>
    </Routes>
  )
}