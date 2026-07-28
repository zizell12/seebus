import React from 'react'
import { Routes, Route } from 'react-router-dom'
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
import AdminDashboard from './pages/admin/AdminDashboard'
import WisataDetail from './pages/WisataDetail'
import HasilPencarian from './pages/booking/HasilPencarian'
import DataPenumpang from './pages/booking/DataPenumpang'
import Pembayaran from './pages/booking/Pembayaran'
import PembayaranBerhasil from './pages/booking/PembayaranBerhasil'
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/wilayah" element={<Wilayah />} />
          <Route path="/perusahaan" element={<Perusahaan />} />
          <Route path="/hubungi-kami" element={<HubungiKami />} />
          <Route path="/kebijakan-perjalanan" element={<KebijakanPerjalanan />} />
          <Route path="/pusat-bantuan" element={<PusatBantuan />} />
          <Route path="/masuk" element={<Masuk />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route path="/wisata/:slug" element={<WisataDetail />} />

          <Route path="/pencarian" element={<HasilPencarian />} />
          <Route path="/pemesanan/penumpang" element={<DataPenumpang />} />
          <Route path="/pemesanan/pembayaran" element={<Pembayaran />} />
          <Route path="/pemesanan/berhasil" element={<PembayaranBerhasil />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
