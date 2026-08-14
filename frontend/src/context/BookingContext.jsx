import React, { createContext, useContext, useState } from 'react'
const BookingContext = createContext(null)
const initialState = {
  search: {
    dari: '',
    tujuan: '',
    tanggal: '',
    penumpang: {
      dewasa: 1,
      anak: 0,
      bayi: 0,
    },
  },
  selectedBus: null,
  booking_id: null,
  booking_code: null,
  harga: null,
  selectedSeats: null,
  passengers: [],
  contact: {
    nama: '',
    email: '',
    phone: '',
    kewarganegaraan: 'Indonesia',
  },
  notes: '',
  payment: {
    metode: null,
    status: 'pending',
  },
}
export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialState)
  const updateSearch = (search) =>
    setBooking((b) => ({
      ...b,
      search,
    }))
  const selectBus = (bus) =>
    setBooking((b) => ({
      ...b,
      selectedBus: bus,
    }))
  const selectSeats = (seats) =>
    setBooking((b) => ({
      ...b,
      selectedSeats: seats,
    }))
  const setPassengers = (passengers) =>
    setBooking((b) => ({
      ...b,
      passengers,
    }))
  const setContact = (contact) =>
    setBooking((b) => ({
      ...b,
      contact,
    }))
  const setBookingId = (bookingId) =>
    setBooking((b) => ({
      ...b,
      booking_id: bookingId,
    }))
  const setBookingCode = (bookingCode) =>
    setBooking((b) => ({
      ...b,
      booking_code: bookingCode,
    }))
  const setHarga = (harga) =>
    setBooking((b) => ({
      ...b,
      harga,
    }))
  const setNotes = (notes) =>
    setBooking((b) => ({
      ...b,
      notes,
    }))
  const setPayment = (payment) =>
    setBooking((b) => ({
      ...b,
      payment,
    }))
  const resetBooking = () => setBooking(initialState)
  // Dipakai halaman "Lanjutkan Pembayaran" (LanjutkanPembayaran.jsx) untuk
  // mengisi ulang BookingContext dari data booking pending yang diambil
  // lewat api.lookupBooking, dengan bentuk yang sama seperti yang dihasilkan
  // alur booking normal (SearchForm -> HasilPencarian -> DataPenumpang),
  // supaya halaman Pembayaran.jsx bisa langsung dipakai lagi tanpa perubahan.
  const hydrateFromLookup = (data) =>
    setBooking((b) => ({
      ...b,
      booking_id: data.booking_id,
      booking_code: data.bk_code,
      search: {
        ...b.search,
        dari: data.jadwal?.dari ?? '',
        tujuan: data.jadwal?.tujuan ?? '',
        tanggal: data.jadwal?.tanggal ?? '',
      },
      selectedBus: {
        jamBerangkat: data.jadwal?.jam_berangkat ?? '',
        jamTiba: '',
        kelas: data.jadwal?.kelas ?? '',
      },
      selectedSeats: {
        nomor: data.kursi ?? [],
      },
      passengers: data.passengers ?? [],
      contact: {
        nama: data.contact?.ct_name ?? '',
        email: data.contact?.ct_email ?? '',
        phone: data.contact?.ct_phone ?? '',
        kewarganegaraan: data.contact?.ct_nationality ?? 'Indonesia',
      },
      harga: {
        publish: data.bk_publish_price ?? 0,
        biayaLayanan: data.biaya_layanan ?? 0,
        total: data.bk_total_price ?? 0,
      },
    }))
  return (
    <BookingContext.Provider
      value={{
        booking,
        updateSearch,
        selectBus,
        selectSeats,
        setPassengers,
        setContact,
        setBookingId,
        setBookingCode,
        setHarga,
        setNotes,
        setPayment,
        resetBooking,
        hydrateFromLookup,
      }}
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
export function totalPenumpang(penumpang) {
  return penumpang.dewasa + penumpang.anak + penumpang.bayi
}
export function kursiDibutuhkan(penumpang) {
  return penumpang.dewasa + penumpang.anak
}
