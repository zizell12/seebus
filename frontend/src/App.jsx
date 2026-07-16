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
import Daftar from './pages/Daftar'
import WisataDetail from './pages/WisataDetail'

import HasilPencarian from './pages/booking/HasilPencarian'
import PilihKursi from './pages/booking/PilihKursi'
import DataPenumpang from './pages/booking/DataPenumpang'
import Pembayaran from './pages/booking/Pembayaran'
import PembayaranBerhasil from './pages/booking/PembayaranBerhasil'

import DashboardCustomer from './pages/dashboard/DashboardCustomer'

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
          <Route path="/daftar" element={<Daftar />} />
          <Route path="/wisata/:slug" element={<WisataDetail />} />

          {/* Alur pemesanan tiket */}
          <Route path="/pencarian" element={<HasilPencarian />} />
          <Route path="/pemesanan/kursi" element={<PilihKursi />} />
          <Route path="/pemesanan/penumpang" element={<DataPenumpang />} />
          <Route path="/pemesanan/pembayaran" element={<Pembayaran />} />
          <Route path="/pemesanan/berhasil" element={<PembayaranBerhasil />} />

          <Route path="/dashboard" element={<DashboardCustomer />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
