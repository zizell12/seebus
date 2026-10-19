import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Pencil } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import { useBooking, totalPenumpang } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import { clearPendingBooking, savePendingBooking } from '../../utils/pendingBooking'
import SeatMap from '../../components/SeatMap'
import backgrounddb from '../../assets/background-db.png'

function getPassengerDraftKey(selectedBus) {
  return `seebus_passenger_draft_${selectedBus?.availability_id || selectedBus?.id || 'unknown'}`
}

function loadPassengerDraft(selectedBus, jumlahPenumpang) {
  try {
    const saved = sessionStorage.getItem(getPassengerDraftKey(selectedBus))
    if (!saved) return null
    const draft = JSON.parse(saved)
    return {
      detailPenumpang: Array.from({ length: jumlahPenumpang }, (_, index) => ({
        nama: '',
        usia: '',
        jenisKelamin: 'Laki-laki',
        kewarganegaraan: 'Indonesia',
        ...draft.detailPenumpang?.[index],
      })),
      kontak: draft.kontak,
      pesan: draft.pesan || '',
      tahap: draft.tahap || 'form',
      fromStopId: draft.fromStopId || null,
      toStopId: draft.toStopId || null,
      selectedSeats: draft.selectedSeats || {},
    }
  } catch {
    return null
  }
}

export default function DataPenumpang() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { booking, selectStops, setPassengers, setContact, setNotes, setBookingId, setBookingCode, setPendingBooking, setHarga } =
    useBooking()
  const { selectedBus } = booking
  const jumlahPenumpang = totalPenumpang(booking.search.penumpang)
  const passengerCategories = [
    ...Array(booking.search.penumpang.dewasa).fill('adult'),
    ...Array(booking.search.penumpang.anak).fill('child'),
    ...Array(booking.search.penumpang.bayi).fill('infant'),
  ]
  const passengerDraft = loadPassengerDraft(selectedBus, jumlahPenumpang)
  const availabilityId = selectedBus?.availability_id || selectedBus?.id

  const [tahap, setTahap] = useState(passengerDraft?.tahap || 'form')
  const [stops, setStops] = useState([])
  const [stopsLoading, setStopsLoading] = useState(false)
  const [stopsError, setStopsError] = useState(null)
  const [seatConfiguration, setSeatConfiguration] = useState(null)
  const [seatConfigurationLoaded, setSeatConfigurationLoaded] = useState(false)
  const [stopsRetry, setStopsRetry] = useState(0)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [kontak, setKontak] = useState(passengerDraft?.kontak || booking.contact)
  const [pesan, setPesan] = useState(passengerDraft?.pesan || booking.notes)
  const [detailPenumpang, setDetailPenumpang] = useState(
    passengerDraft?.detailPenumpang ||
      Array.from({ length: jumlahPenumpang }, () => ({
        nama: '',
        usia: '',
        jenisKelamin: 'Laki-laki',
        kewarganegaraan: 'Indonesia',
      })),
  )
  const [fromStopId, setFromStopId] = useState(passengerDraft?.fromStopId || null)
  const [toStopId, setToStopId] = useState(passengerDraft?.toStopId || null)
  const [selectedSeats, setSelectedSeats] = useState(passengerDraft?.selectedSeats || {})
  const [seatMap, setSeatMap] = useState(null)
  const [seatMapLoading, setSeatMapLoading] = useState(false)
  const [seatMapError, setSeatMapError] = useState(null)
  const [seatMapRetry, setSeatMapRetry] = useState(0)
  const requiresSeatNumbers = Boolean(seatConfiguration?.pakai_nomor_kursi)
  const hasSeatRequiredPassengers = passengerCategories.some((category) => category !== 'infant')
  const [activeSeatPassenger, setActiveSeatPassenger] = useState(
    passengerCategories.findIndex((category) => category !== 'infant'),
  )

  useEffect(() => {
    try {
      sessionStorage.setItem(
        getPassengerDraftKey(selectedBus),
        JSON.stringify({ detailPenumpang, kontak, pesan, tahap, fromStopId, toStopId, selectedSeats }),
      )
    } catch {
      // Form tetap dapat digunakan meskipun penyimpanan browser tidak tersedia.
    }
  }, [selectedBus, detailPenumpang, kontak, pesan, tahap, fromStopId, toStopId, selectedSeats])

  useEffect(() => {
    if (!selectedBus) navigate('/pencarian')
  }, [selectedBus, navigate])

  useEffect(() => {
    if (!availabilityId || tahap === 'form') return undefined
    let active = true

    async function loadStops() {
      setStopsLoading(true)
      setStopsError(null)
      setSeatConfigurationLoaded(false)
      try {
        const data = await api.getTitikPemberhentian(availabilityId)
        if (!active) return
        setStops(data.stops)
        setSeatConfiguration({
          pakai_nomor_kursi: data.pakai_nomor_kursi,
          pola_kursi: data.pola_kursi,
        })
        setSeatConfigurationLoaded(true)
        if (!data.pakai_nomor_kursi && tahap === 'kursi') setTahap('titik')
      } catch (err) {
        if (!active) return
        setStopsError(err.message || 'Gagal memuat titik pemberhentian')
        setStops([])
        setSeatConfiguration(null)
        setSeatConfigurationLoaded(false)
      } finally {
        if (active) setStopsLoading(false)
      }
    }

    loadStops()
    return () => { active = false }
  }, [availabilityId, tahap === 'form', stopsRetry])

  useEffect(() => {
    if (
      !availabilityId
      || !seatConfigurationLoaded
      || !requiresSeatNumbers
      || !hasSeatRequiredPassengers
      || !fromStopId
      || !toStopId
    ) {
      setSeatMap(null)
      setSeatMapError(null)
      setSeatMapLoading(false)
      return undefined
    }

    let active = true
    setSeatMap(null)
    setSeatMapError(null)
    setSeatMapLoading(true)

    api.getSeatMap(availabilityId, {
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
    })
      .then((map) => {
        if (active) setSeatMap(map)
      })
      .catch((err) => {
        if (active) {
          console.error('Gagal memuat denah kursi', err)
          setSeatMapError(err.message || t.seatMap.loadError)
        }
      })
      .finally(() => {
        if (active) setSeatMapLoading(false)
      })

    return () => { active = false }
  }, [availabilityId, seatConfigurationLoaded, requiresSeatNumbers, hasSeatRequiredPassengers, fromStopId, toStopId, seatMapRetry, t.seatMap.loadError])

  const titikNaik = stops.filter((s) => s.bisa_naik)
  const titikTurun = stops.filter((s) => s.bisa_turun && (!fromStopId || s.stop_order > (stops.find((x) => x.route_stop_id === fromStopId)?.stop_order ?? -1)))
  const stopTerpilihDari = stops.find((s) => s.route_stop_id === fromStopId)
  const stopTerpilihKe = stops.find((s) => s.route_stop_id === toStopId)

  const releasePreviousPendingBooking = async () => {
    const pending = booking.pendingBooking || (
      booking.booking_code && booking.contact.email
        ? { bk_code: booking.booking_code, email: booking.contact.email }
        : null
    )
    if (!pending?.bk_code || !pending.email) return

    try {
      await api.releasePendingBooking({ bk_code: pending.bk_code, email: pending.email })
      clearPendingBooking()
      setPendingBooking(null)
      setBookingId(null)
      setBookingCode(null)
    } catch (error) {
      console.warn('Booking pending sebelumnya tidak dapat dilepas; booking baru tetap dilanjutkan.', error)
    }
  }

  const updateDetail = (index, field, value) => {
    setDetailPenumpang((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSimpanData = (e) => {
    e.preventDefault()
    setContact(kontak)
    setNotes(pesan)
    setTahap('titik')
  }

  const createBooking = async () => {
    const passengersPayload = detailPenumpang.map((p, i) => ({
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
      ps_category: passengerCategories[i] || 'adult',
      ps_name: p.nama,
      ps_age: Number(p.usia),
      ps_gender: p.jenisKelamin === 'Perempuan' ? 'female' : 'male',
      ps_nationality: p.kewarganegaraan || 'Indonesia',
      ps_seat_number: passengerCategories[i] === 'infant' ? null : selectedSeats[i] || null,
    }))
    setPassengers(passengersPayload)
    setContact(kontak)
    setNotes(pesan)
    setBookingError(null)
    setBookingLoading(true)

    try {
      await releasePreviousPendingBooking()
      const payload = {
        contact: {
          ct_name: kontak.nama,
          ct_email: kontak.email,
          ct_phone: kontak.phone,
          ct_nationality: kontak.kewarganegaraan,
        },
        availability_id: selectedBus.availability_id || selectedBus.id,
        booking: {
          bk_notes: pesan || null,
        },
        passengers: passengersPayload,
      }

      const response = await api.createBooking(payload)
      setBookingId(response.data.booking_id)
      setBookingCode(response.data.booking_code)
      setPendingBooking({
        bk_code: response.data.booking_code,
        email: kontak.email,
        expiresAt: response.data.berlaku_sampai || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      savePendingBooking({
        code: response.data.booking_code,
        expiresAt: response.data.berlaku_sampai || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      setHarga({
        publish: response.data.bk_publish_price,
        total: response.data.bk_total_price,
        biayaLayanan: response.data.biaya_layanan,
      })
      navigate('/pemesanan/pembayaran')
    } catch (err) {
      console.error(err)
      const seatConflict = err.message?.toLowerCase().includes('nomor kursi baru saja dipesan')
      if (seatConflict) {
        setSelectedSeats({})
        setSeatMapRetry((attempt) => attempt + 1)
        setBookingError(t.penumpangPage.seatConflict)
      } else {
        setBookingError(err.message || t.penumpangPage.errorDefault)
      }
    } finally {
      setBookingLoading(false)
    }
  }

  const handleLanjutPembayaran = async () => {
    if (!fromStopId || !toStopId || !seatConfigurationLoaded || stopsLoading) return

    selectStops({
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
      fromName: stopTerpilihDari?.nama,
      toName: stopTerpilihKe?.nama,
    })

    if (!requiresSeatNumbers || !hasSeatRequiredPassengers) {
      await createBooking()
      return
    }

    const requiredSeats = passengerCategories.filter((category) => category !== 'infant').length
    if (!seatMap) return
    if (Object.keys(selectedSeats).length !== requiredSeats) {
      setBookingError('Pilih nomor kursi yang tersedia pada denah untuk setiap penumpang.')
      return
    }

    await createBooking()
  }

  const handlePilihKursi = async () => {
    if (!seatMap) return

    const requiredSeats = passengerCategories.filter((category) => category !== 'infant').length
    if (Object.keys(selectedSeats).length !== requiredSeats) {
      setBookingError('Pilih satu kursi untuk setiap penumpang selain bayi.')
      return
    }
    await createBooking()
  }

  if (!selectedBus) return null

  return (
    <div>
      <section
        className="relative bg-navy-900 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(11,30,77,0.85), rgba(11,30,77,0.75)), url(${backgrounddb})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 text-center">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-6">SeeBus - Pesan Mudah, Perjalanan Nyaman</h1>
          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      <BookingSummaryBar showUbah={false} />

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 pb-14 space-y-8">
        {tahap === 'form' ? (
          <form onSubmit={handleSimpanData} className="space-y-8">
            <div>
              <h2 className="font-bold text-navy-900 mb-4">{t.penumpangPage.informasiPenumpang}</h2>
              <div className="card">
                <p className="text-sm font-semibold text-navy-900 mb-4">
                  {t.penumpangPage.kontakPemesan} ({jumlahPenumpang} {t.penumpangPage.penumpangLabel})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelNama}</label>
                    <input
                      required
                      value={kontak.nama}
                      onChange={(e) => setKontak({ ...kontak, nama: e.target.value })}
                      placeholder={t.penumpangPage.placeholderNama}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelEmail}</label>
                    <input
                      required
                      type="email"
                      value={kontak.email}
                      onChange={(e) => setKontak({ ...kontak, email: e.target.value })}
                      placeholder="contact@gmail.com"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelPhone}</label>
                    <input
                      required
                      value={kontak.phone}
                      onChange={(e) => setKontak({ ...kontak, phone: e.target.value })}
                      placeholder="+628734567123"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelKewarganegaraan}</label>
                    <select
                      value={kontak.kewarganegaraan}
                      onChange={(e) => setKontak({ ...kontak, kewarganegaraan: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    >
                      <option>{t.penumpangPage.opsiIndonesia}</option>
                      <option>{t.penumpangPage.opsiLainnya}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-navy-900 mb-4">{t.penumpangPage.detailPenumpang}</h2>
              <div className="space-y-4">
                {detailPenumpang.map((p, i) => (
                  <div key={i} className="card">
                    <p className="text-sm font-semibold text-navy-900 mb-3">
                      {t.penumpangPage.penumpangKe} {i + 1}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">{t.penumpangPage.labelNamaPenumpang}</label>
                        <input
                          required
                          value={p.nama}
                          onChange={(e) => updateDetail(i, 'nama', e.target.value)}
                          placeholder={t.penumpangPage.placeholderNamaPenumpang}
                          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">{t.penumpangPage.labelUsia}</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={p.usia}
                          onChange={(e) => updateDetail(i, 'usia', Math.max(0, Number(e.target.value)) || '')}
                          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">{t.penumpangPage.labelJenisKelamin}</label>
                        <select
                          value={p.jenisKelamin}
                          onChange={(e) => updateDetail(i, 'jenisKelamin', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                        >
                          <option>Laki-laki</option>
                          <option>Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">{t.penumpangPage.labelKewarganegaraan}</label>
                        <input
                          value={p.kewarganegaraan}
                          onChange={(e) => updateDetail(i, 'kewarganegaraan', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-navy-900">{t.penumpangPage.pesanTambahan}</label>
              <textarea
                rows={4}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900 resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              {t.penumpangPage.simpanDataPenumpang}
            </button>
          </form>
        ) : tahap === 'kursi' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-navy-900">Pilih nomor kursi</h2>
                <p className="text-sm text-gray-500">{stopTerpilihDari?.nama} → {stopTerpilihKe?.nama}</p>
              </div>
              <button type="button" onClick={() => setTahap('titik')} className="text-sm text-brand-red font-medium">
                Ubah titik
              </button>
            </div>
            {stopsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                <p role="alert">{stopsError}</p>
                <button
                  type="button"
                  onClick={() => setStopsRetry((attempt) => attempt + 1)}
                  className="mt-2 font-semibold underline"
                >
                  {t.seatMap.retry}
                </button>
              </div>
            ) : !seatConfigurationLoaded || seatMapLoading ? (
              <p role="status" className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
                {t.seatMap.loading}
              </p>
            ) : seatMapError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                <p role="alert">{seatMapError || t.seatMap.loadError}</p>
                <button
                  type="button"
                  onClick={() => setSeatMapRetry((attempt) => attempt + 1)}
                  className="mt-2 font-semibold underline"
                >
                  {t.seatMap.retry}
                </button>
              </div>
            ) : seatMap && (
              <SeatMap
                rows={seatMap.rows}
                pattern={seatMap.pola_kursi || seatConfiguration?.pola_kursi || '2-2'}
                selectedSeats={selectedSeats}
                passengers={detailPenumpang
                  .map((passenger, index) => ({ ...passenger, index }))
                  .filter((_, index) => passengerCategories[index] !== 'infant')}
                activePassenger={activeSeatPassenger}
                onSelectPassenger={setActiveSeatPassenger}
                onSelectSeat={(passengerIndex, seatNumber) =>
                  setSelectedSeats((current) => ({ ...current, [passengerIndex]: seatNumber }))
                }
                labels={{
                  selectPassenger: t.seatMap.selectPassenger,
                  front: t.seatMap.front,
                  seat: t.seatMap.seat,
                  unavailable: t.seatMap.unavailable,
                  available: t.seatMap.available,
                  occupied: t.seatMap.occupied,
                  selected: t.seatMap.selected,
                }}
              />
            )}
            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{bookingError}</p>
            )}
            <button
              disabled={!seatMap || bookingLoading || Object.keys(selectedSeats).length !== passengerCategories.filter((category) => category !== 'infant').length}
              onClick={handlePilihKursi}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bookingLoading ? t.penumpangPage.menyimpan : t.penumpangPage.lanjutPembayaran}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-900">{t.penumpangPage.dataPenumpang}</h2>
                <button
                  onClick={async () => {
                    await releasePreviousPendingBooking()
                    setTahap('form')
                  }}
                  className="flex items-center gap-1 text-xs text-brand-red font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" /> {t.penumpangPage.ubahData}
                </button>
              </div>
              <div className="card space-y-3">
                {detailPenumpang.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-navy-900">{p.nama}</p>
                      <p className="text-xs text-gray-400">
                        {p.jenisKelamin === 'Perempuan' ? t.penumpangPage.perempuan : t.penumpangPage.lakiLaki} ·{' '}
                        {p.usia} {t.penumpangPage.tahun}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-navy-900 mb-4">Titik Naik & Turun</h2>

              {stopsLoading && <p className="text-sm text-gray-400">Memuat titik pemberhentian...</p>}
              {stopsError && <p className="text-sm text-brand-red">{stopsError}</p>}

              {!stopsLoading && !stopsError && (
                <div className="card space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Naik dari</label>
                      <select
                        required
                        value={fromStopId || ''}
                        onChange={(e) => {
                          setFromStopId(Number(e.target.value))
                          setToStopId(null)
                          setSelectedSeats({})
                          setSeatMap(null)
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-navy-900"
                      >
                        <option value="">Pilih titik naik</option>
                        {titikNaik.map((s) => (
                          <option key={s.route_stop_id} value={s.route_stop_id} disabled={s.sisa_stok_dari_sini < jumlahPenumpang}>
                            {s.nama} {s.sisa_stok_dari_sini < jumlahPenumpang ? '(kursi tidak cukup)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Turun di</label>
                      <select
                        required
                        value={toStopId || ''}
                        disabled={!fromStopId}
                        onChange={(e) => {
                          setToStopId(Number(e.target.value))
                          setSelectedSeats({})
                          setSeatMap(null)
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-navy-900 disabled:opacity-50"
                      >
                        <option value="">Pilih titik turun</option>
                        {titikTurun.map((s) => (
                          <option key={s.route_stop_id} value={s.route_stop_id}>
                            {s.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {stopTerpilihDari && stopTerpilihKe && (
                    <div className="flex items-center gap-2 text-sm text-navy-900 bg-navy-900/5 rounded-lg px-3 py-2.5">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>
                        {stopTerpilihDari.nama} → {stopTerpilihKe.nama} · Sisa {stopTerpilihDari.sisa_stok_dari_sini}{' '}
                        kursi
                      </span>
                    </div>
                  )}
                </div>
              )}

              {requiresSeatNumbers && hasSeatRequiredPassengers && fromStopId && toStopId && (
                <div className="mt-5 space-y-4">
                  {!seatConfigurationLoaded || seatMapLoading ? (
                    <p role="status" className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
                      {t.seatMap.loading}
                    </p>
                  ) : seatMapError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                      <p role="alert">{seatMapError || t.seatMap.loadError}</p>
                      <button
                        type="button"
                        onClick={() => setSeatMapRetry((attempt) => attempt + 1)}
                        className="mt-2 font-semibold underline"
                      >
                        {t.seatMap.retry}
                      </button>
                    </div>
                  ) : seatMap ? (
                    <SeatMap
                      rows={seatMap.rows}
                      pattern={seatMap.pola_kursi || seatConfiguration?.pola_kursi || '2-2'}
                      selectedSeats={selectedSeats}
                      passengers={detailPenumpang
                        .map((passenger, index) => ({ ...passenger, index }))
                        .filter((_, index) => passengerCategories[index] !== 'infant')}
                      activePassenger={activeSeatPassenger}
                      onSelectPassenger={(index) => {
                        setActiveSeatPassenger(index)
                        setBookingError(null)
                      }}
                      onSelectSeat={(passengerIndex, seatNumber) => {
                        setSelectedSeats((current) => ({ ...current, [passengerIndex]: seatNumber }))
                        setBookingError(null)
                      }}
                      labels={{
                        selectPassenger: t.seatMap.selectPassenger,
                        front: t.seatMap.front,
                        seat: t.seatMap.seat,
                        unavailable: t.seatMap.unavailable,
                        available: t.seatMap.available,
                        occupied: t.seatMap.occupied,
                        selected: t.seatMap.selected,
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>

            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}

            {requiresSeatNumbers && hasSeatRequiredPassengers && fromStopId && toStopId && (
              <p className="text-sm text-navy-900 bg-navy-900/5 rounded-lg px-3 py-2.5">
                {t.penumpangPage.seatSelectionRequired}
              </p>
            )}

            <button
              disabled={
                !fromStopId
                || !toStopId
                || !seatConfigurationLoaded
                || stopsLoading
                || bookingLoading
                || (requiresSeatNumbers && (!seatMap || seatMapLoading))
              }
              onClick={handleLanjutPembayaran}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bookingLoading ? t.penumpangPage.menyimpan : t.penumpangPage.lanjutPembayaran}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
