import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Pencil } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import { useBooking, kursiDibutuhkan } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../utils/api'
import { savePendingBooking } from '../../utils/pendingBooking'
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
    }
  } catch {
    return null
  }
}

export default function DataPenumpang() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { booking, selectStops, setPassengers, setContact, setNotes, setBookingId, setBookingCode, setHarga } =
    useBooking()
  const { selectedBus } = booking
  const jumlahPenumpang = kursiDibutuhkan(booking.search.penumpang)
  const passengerDraft = loadPassengerDraft(selectedBus, jumlahPenumpang)

  const [tahap, setTahap] = useState(passengerDraft?.tahap || 'form')
  const [stops, setStops] = useState([])
  const [stopsLoading, setStopsLoading] = useState(false)
  const [stopsError, setStopsError] = useState(null)
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

  useEffect(() => {
    try {
      sessionStorage.setItem(
        getPassengerDraftKey(selectedBus),
        JSON.stringify({ detailPenumpang, kontak, pesan, tahap, fromStopId, toStopId }),
      )
    } catch {
      // Form tetap dapat digunakan meskipun penyimpanan browser tidak tersedia.
    }
  }, [selectedBus, detailPenumpang, kontak, pesan, tahap, fromStopId, toStopId])

  useEffect(() => {
    if (!selectedBus) navigate('/pencarian')
  }, [selectedBus, navigate])

  useEffect(() => {
    async function loadStops() {
      if (!selectedBus || tahap !== 'titik') return
      setStopsLoading(true)
      setStopsError(null)
      try {
        const data = await api.getTitikPemberhentian(selectedBus.availability_id || selectedBus.id)
        setStops(data)
      } catch (err) {
        setStopsError(err.message || 'Gagal memuat titik pemberhentian')
        setStops([])
      }
      setStopsLoading(false)
    }

    loadStops()
  }, [selectedBus, tahap])

  const titikNaik = stops.filter((s) => s.bisa_naik)
  const titikTurun = stops.filter((s) => s.bisa_turun && (!fromStopId || s.stop_order > (stops.find((x) => x.route_stop_id === fromStopId)?.stop_order ?? -1)))
  const stopTerpilihDari = stops.find((s) => s.route_stop_id === fromStopId)
  const stopTerpilihKe = stops.find((s) => s.route_stop_id === toStopId)

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

  const handleLanjutPembayaran = async () => {
    if (!fromStopId || !toStopId) return

    selectStops({
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
      fromName: stopTerpilihDari?.nama,
      toName: stopTerpilihKe?.nama,
    })

    const categories = [
      ...Array(booking.search.penumpang.dewasa).fill('adult'),
      ...Array(booking.search.penumpang.anak).fill('child'),
      ...Array(booking.search.penumpang.bayi).fill('infant'),
    ]

    const passengersPayload = detailPenumpang.map((p, i) => ({
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
      ps_category: categories[i] || 'adult',
      ps_name: p.nama,
      ps_age: Number(p.usia),
      ps_gender: p.jenisKelamin === 'Perempuan' ? 'female' : 'male',
      ps_nationality: p.kewarganegaraan || 'Indonesia',
    }))
    setPassengers(passengersPayload)
    setContact(kontak)
    setNotes(pesan)
    setBookingError(null)
    setBookingLoading(true)

    try {
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
      setBookingError(err.message || t.penumpangPage.errorDefault)
    } finally {
      setBookingLoading(false)
    }
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
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-900">{t.penumpangPage.dataPenumpang}</h2>
                <button
                  onClick={() => setTahap('form')}
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
                        onChange={(e) => setToStopId(Number(e.target.value))}
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
            </div>

            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}

            <button
              disabled={!fromStopId || !toStopId || bookingLoading}
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
