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
        setNotes,
        setPayment,
        resetBooking,
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
