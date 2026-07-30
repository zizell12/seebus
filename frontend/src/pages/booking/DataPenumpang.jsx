import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Armchair, Pencil } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import SeatPickerModal from '../../components/SeatPickerModal'
import { useBooking, kursiDibutuhkan } from '../../context/BookingContext'
import { useLanguage } from '../../context/LanguageContext'
import { api, getSessionId } from '../../utils/api'
import backgrounddb from '../../assets/background-db.png'
export default function DataPenumpang() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { booking, selectSeats, setPassengers, setContact, setNotes, setBookingId, setHarga } = useBooking()
  const { selectedBus } = booking
  const jumlahKursi = kursiDibutuhkan(booking.search.penumpang)
  const [tahap, setTahap] = useState('form')
  const [modalOpen, setModalOpen] = useState(false)
  const [seats, setSeats] = useState([])
  const [seatLoading, setSeatLoading] = useState(false)
  const [seatError, setSeatError] = useState(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [kontak, setKontak] = useState({
    nama: '',
    email: '',
    phone: '',
    kewarganegaraan: 'Indonesia',
  })

  useEffect(() => {
    if (!selectedBus) navigate('/pencarian')
  }, [selectedBus, navigate])

  useEffect(() => {
    async function loadSeats() {
      if (!selectedBus || tahap !== 'kursi') return
      setSeatLoading(true)
      setSeatError(null)
      try {
        const data = await api.getKursi(selectedBus.availability_id)
        setSeats(data)
      } catch (err) {
        setSeatError(err.message || 'Gagal memuat kursi')
        setSeats([])
      }
      setSeatLoading(false)
    }

    loadSeats()
  }, [selectedBus, tahap])

  const [detailPenumpang, setDetailPenumpang] = useState(
    Array.from(
      {
        length: jumlahKursi,
      },
      () => ({
        nama: '',
        usia: '',
        jenisKelamin: 'Laki-laki',
        kewarganegaraan: 'Indonesia',
      }),
    ),
  )
  const [pesan, setPesan] = useState('')
  const [kursiTerpilih, setKursiTerpilih] = useState(null)
  const kursiTerpilihRef = useRef(null)
  const bookingDibuatRef = useRef(false)
  useEffect(() => {
    kursiTerpilihRef.current = kursiTerpilih
  }, [kursiTerpilih])
  useEffect(() => {
    return () => {
      // Kalau halaman ini ditinggalkan (pindah rute) sebelum booking berhasil
      // dibuat, lepas lock kursi supaya tidak menahan kursi tanpa guna.
      // Best-effort: kalau request tidak sempat selesai (misal tab ditutup),
      // job pembersih lock kedaluwarsa di backend yang akan melepasnya.
      if (!bookingDibuatRef.current && kursiTerpilihRef.current?.nomor?.length && selectedBus?.availability_id) {
        api
          .unlockKursi({
            availability_id: selectedBus.availability_id,
            nomor_kursi: kursiTerpilihRef.current.nomor,
          })
          .catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const updateDetail = (index, field, value) => {
    setDetailPenumpang((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }
  const handleSimpanData = (e) => {
    e.preventDefault()
    setContact(kontak)
    setNotes(pesan)
    setTahap('kursi')
  }
  const handleKonfirmasiKursi = async (seatIdentifiers) => {
    const selected = seats.filter(
      (seat) => seatIdentifiers.includes(seat.seat_id) || seatIdentifiers.includes(seat.nomor),
    )
    const nomorBaru = selected.map((seat) => seat.nomor)

    setSeatError(null)
    try {
      if (kursiTerpilih?.nomor?.length) {
        await api.unlockKursi({
          availability_id: selectedBus.availability_id,
          nomor_kursi: kursiTerpilih.nomor,
        })
      }
      await api.lockKursi({
        availability_id: selectedBus.availability_id,
        nomor_kursi: nomorBaru,
      })
      setKursiTerpilih({
        seatIds: selected.map((seat) => seat.seat_id),
        nomor: nomorBaru,
      })
      setModalOpen(false)
    } catch (err) {
      // Kemungkinan besar kursi barusan diambil orang lain -> muat ulang
      // status kursi terbaru supaya modal langsung menunjukkan kursi mana
      // yang sekarang tidak tersedia.
      setSeatError(err.message || 'Kursi yang dipilih sudah tidak tersedia, silakan pilih kursi lain.')
      try {
        const data = await api.getKursi(selectedBus.availability_id)
        setSeats(data)
      } catch {
        // abaikan, pesan error di atas sudah cukup untuk diketahui user
      }
    }
  }
  const handleLanjutPembayaran = async () => {
    selectSeats(kursiTerpilih)
    const passengers = detailPenumpang.map((p, i) => ({
      seat_id: kursiTerpilih.seatIds[i],
      nomor: kursiTerpilih.nomor[i],
      ...p,
    }))
    setPassengers(passengers)
    setContact(kontak)
    setNotes(pesan)
    setBookingError(null)
    setBookingLoading(true)

    try {
      const categories = [
        ...Array(booking.search.penumpang.dewasa).fill('adult'),
        ...Array(booking.search.penumpang.anak).fill('child'),
        ...Array(booking.search.penumpang.bayi).fill('infant'),
      ]
      const payload = {
        contact: {
          ct_name: kontak.nama,
          ct_email: kontak.email,
          ct_phone: kontak.phone,
          ct_nationality: kontak.kewarganegaraan,
        },
        availability_id: selectedBus.availability_id || selectedBus.id,
        user_id: null,
        session_id: getSessionId(),
        booking: {
          bk_notes: pesan || null,
          bk_adult_count: booking.search.penumpang.dewasa,
          bk_child_count: booking.search.penumpang.anak,
          bk_infant_count: booking.search.penumpang.bayi,
          bk_status: 'pending',
        },
        passengers: passengers.map((p, i) => ({
          seat_id: p.seat_id,
          ps_category: categories[i] || 'adult',
          ps_name: p.nama,
          ps_age: Number(p.usia),
          ps_gender: p.jenisKelamin === 'Perempuan' ? 'female' : 'male',
          ps_nationality: p.kewarganegaraan || 'Indonesia',
        })),
      }

      const response = await api.createBooking(payload)
      bookingDibuatRef.current = true
      setBookingId(response.data.booking_id)
      setHarga({
        net: response.data.bk_net_price,
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
                  {t.penumpangPage.kontakPemesan} ({jumlahKursi} {t.penumpangPage.penumpangLabel})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelNama}</label>
                    <input
                      required
                      value={kontak.nama}
                      onChange={(e) =>
                        setKontak({
                          ...kontak,
                          nama: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setKontak({
                          ...kontak,
                          email: e.target.value,
                        })
                      }
                      placeholder="contact@gmail.com"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelPhone}</label>
                    <input
                      required
                      value={kontak.phone}
                      onChange={(e) =>
                        setKontak({
                          ...kontak,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+628734567123"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t.penumpangPage.labelKewarganegaraan}</label>
                    <select
                      value={kontak.kewarganegaraan}
                      onChange={(e) =>
                        setKontak({
                          ...kontak,
                          kewarganegaraan: e.target.value,
                        })
                      }
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
                        {p.jenisKelamin === 'Perempuan' ? t.penumpangPage.perempuan : t.penumpangPage.lakiLaki} · {p.usia}{' '}
                        {t.penumpangPage.tahun}
                      </p>
                    </div>
                    {kursiTerpilih && (
                      <span className="text-xs font-semibold text-navy-900 bg-navy-900/5 rounded-full px-3 py-1">
                        {t.penumpangPage.kursiLabel} {kursiTerpilih.nomor[i]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-navy-900 mb-4">{t.penumpangPage.pilihKursiJudul}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="card w-full flex items-center justify-between hover:border-navy-900 transition-colors border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy-900/5 flex items-center justify-center">
                    <Armchair className="w-4 h-4 text-brand-red" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-navy-900">
                      {kursiTerpilih
                        ? `${t.penumpangPage.kursiLabel} ${kursiTerpilih.nomor.join(', ')} ${t.penumpangPage.kursiDipilih}`
                        : t.penumpangPage.belumAdaKursi}
                    </p>
                    <p className="text-xs text-gray-400">
                      {jumlahKursi} {t.penumpangPage.kursiDibutuhkan} {jumlahKursi} {t.penumpangPage.penumpangKecil}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-brand-red font-medium">
                  {kursiTerpilih ? t.penumpangPage.ubah : t.penumpangPage.pilihKursi}
                </span>
              </button>
            </div>

            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}

            <button
              disabled={!kursiTerpilih || bookingLoading}
              onClick={handleLanjutPembayaran}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bookingLoading ? t.penumpangPage.menyimpan : t.penumpangPage.lanjutPembayaran}
            </button>
          </div>
        )}
      </div>

      <SeatPickerModal
        open={modalOpen}
        jumlahKursi={jumlahKursi}
        seats={seats}
        loading={seatLoading}
        error={seatError}
        initialSelected={kursiTerpilih?.nomor || []}
        onClose={() => setModalOpen(false)}
        onConfirm={handleKonfirmasiKursi}
      />
    </div>
  )
}
