import React, { createContext, useContext, useState } from 'react'
const BookingContext = createContext(null)
const BOOKING_STORAGE_KEY = 'seebus_booking_draft'
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
function loadBookingState() {
  try {
    const saved = sessionStorage.getItem(BOOKING_STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved)
    return {
      ...initialState,
      ...parsed,
      search: { ...initialState.search, ...parsed.search, penumpang: { ...initialState.search.penumpang, ...parsed.search?.penumpang } },
      contact: { ...initialState.contact, ...parsed.contact },
      payment: { ...initialState.payment, ...parsed.payment },
    }
  } catch {
    return initialState
  }
}
export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(loadBookingState)
  const saveBooking = (updater) => {
    setBooking((previousBooking) => {
      const nextBooking = typeof updater === 'function' ? updater(previousBooking) : updater
      try {
        sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(nextBooking))
      } catch {
        // Draft tetap berjalan meskipun penyimpanan browser tidak tersedia.
      }
      return nextBooking
    })
  }
  const updateSearch = (search) =>
    saveBooking((b) => ({
      ...b,
      search,
    }))
  const selectBus = (bus) =>
    saveBooking((b) => ({
      ...b,
      selectedBus: bus,
    }))
  const selectSeats = (seats) =>
    saveBooking((b) => ({
      ...b,
      selectedSeats: seats,
    }))
  const setPassengers = (passengers) =>
    saveBooking((b) => ({
      ...b,
      passengers,
    }))
  const setContact = (contact) =>
    saveBooking((b) => ({
      ...b,
      contact,
    }))
  const setBookingId = (bookingId) =>
    saveBooking((b) => ({
      ...b,
      booking_id: bookingId,
    }))
  const setBookingCode = (bookingCode) =>
    saveBooking((b) => ({
      ...b,
      booking_code: bookingCode,
    }))
  const setHarga = (harga) =>
    saveBooking((b) => ({
      ...b,
      harga,
    }))
  const setNotes = (notes) =>
    saveBooking((b) => ({
      ...b,
      notes,
    }))
  const setPayment = (payment) =>
    saveBooking((b) => ({
      ...b,
      payment,
    }))
  const resetBooking = () => {
    setBooking(initialState)
    sessionStorage.removeItem(BOOKING_STORAGE_KEY)
  }
  // Dipakai halaman "Lanjutkan Pembayaran" (LanjutkanPembayaran.jsx) untuk
  // mengisi ulang BookingContext dari data booking pending yang diambil
  // lewat api.lookupBooking, dengan bentuk yang sama seperti yang dihasilkan
  // alur booking normal (SearchForm -> HasilPencarian -> DataPenumpang),
  // supaya halaman Pembayaran.jsx bisa langsung dipakai lagi tanpa perubahan.
  const hydrateFromLookup = (data) =>
    saveBooking((b) => ({
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
