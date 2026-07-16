import React, { createContext, useContext, useState } from 'react'

// Menyimpan seluruh state alur pemesanan tiket:
// pencarian -> pilih bus -> pilih kursi -> data penumpang -> pembayaran
const BookingContext = createContext(null)

const initialState = {
  search: {
    dari: '',
    tujuan: '',
    tanggal: '',
    penumpang: { dewasa: 1, anak: 0, bayi: 0 },
  },
  selectedBus: null,      // { id, operator, kategori, harga, jamBerangkat, ... }
  selectedSeats: null,    // { seatIds: [1,2], nomor: ['A1','A2'] }
  passengers: [],         // [{ seat_id, nomor, nama, nik, jenisKelamin }]
  payment: { metode: null, status: 'pending' }, // status: pending | success | failed
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialState)

  const updateSearch = (search) => setBooking((b) => ({ ...b, search }))
  const selectBus = (bus) => setBooking((b) => ({ ...b, selectedBus: bus }))
  const selectSeats = (seats) => setBooking((b) => ({ ...b, selectedSeats: seats }))
  const setPassengers = (passengers) => setBooking((b) => ({ ...b, passengers }))
  const setPayment = (payment) => setBooking((b) => ({ ...b, payment }))
  const resetBooking = () => setBooking(initialState)

  return (
    <BookingContext.Provider
      value={{ booking, updateSearch, selectBus, selectSeats, setPassengers, setPayment, resetBooking }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking harus dipakai di dalam BookingProvider')
  return ctx
}

// Helper: total semua kategori penumpang (buat ditampilkan sebagai teks "X penumpang")
export function totalPenumpang(penumpang) {
  return penumpang.dewasa + penumpang.anak + penumpang.bayi
}

// Helper: jumlah kursi yang perlu dipesan.
// Bayi (di bawah 2 tahun) biasanya duduk dipangku, jadi tidak butuh kursi sendiri.
export function kursiDibutuhkan(penumpang) {
  return penumpang.dewasa + penumpang.anak
}
