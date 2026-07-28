import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Armchair, Pencil } from 'lucide-react'
import SearchForm from '../../components/SearchForm'
import BookingSummaryBar from '../../components/BookingSummaryBar'
import SeatPickerModal from '../../components/SeatPickerModal'
import { useBooking, kursiDibutuhkan } from '../../context/BookingContext'
import { api } from '../../utils/api'
import backgrounddb from '../../assets/background-db.png'
export default function DataPenumpang() {
  const navigate = useNavigate()
  const { booking, selectSeats, setPassengers, setContact, setNotes, setBookingId } = useBooking()
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
  const handleKonfirmasiKursi = (seatIdentifiers) => {
    const selected = seats.filter(
      (seat) => seatIdentifiers.includes(seat.seat_id) || seatIdentifiers.includes(seat.nomor),
    )
    setKursiTerpilih({
      seatIds: selected.map((seat) => seat.seat_id),
      nomor: selected.map((seat) => seat.nomor),
    })
    setModalOpen(false)
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
      const totalHarga =
      booking.search.penumpang.dewasa * selectedBus.harga +
      booking.search.penumpang.anak * (selectedBus.hargaAnak ?? selectedBus.harga)
      const payload = {
        contact: {
          ct_name: kontak.nama,
          ct_email: kontak.email,
          ct_phone: kontak.phone,
          ct_nationality: kontak.kewarganegaraan,
        },
        availability_id: selectedBus.availability_id || selectedBus.id,
        user_id: null,
        booking: {
          bk_notes: pesan || null,
          bk_adult_count: booking.search.penumpang.dewasa,
          bk_child_count: booking.search.penumpang.anak,
          bk_infant_count: booking.search.penumpang.bayi,
          bk_net_price: totalHarga,
          bk_publish_price: totalHarga,
          bk_total_price: totalHarga,
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
      setBookingId(response.data.booking_id)
      navigate('/pemesanan/pembayaran')
    } catch (err) {
      console.error(err)
      setBookingError(err.message || 'Gagal menyimpan data pemesanan. Silakan coba lagi.')
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <p className="text-xs text-gray-400">Beranda &gt; Detail Penumpang</p>
      </div>

      <BookingSummaryBar />

      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-14 space-y-8">
        {tahap === 'form' ? (
          <form onSubmit={handleSimpanData} className="space-y-8">
            <div>
              <h2 className="font-bold text-navy-900 mb-4">Informasi Penumpang</h2>
              <div className="card">
                <p className="text-sm font-semibold text-navy-900 mb-4">Kontak Pemesan ({jumlahKursi} Penumpang)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Nama*</label>
                    <input
                      required
                      value={kontak.nama}
                      onChange={(e) =>
                        setKontak({
                          ...kontak,
                          nama: e.target.value,
                        })
                      }
                      placeholder="Nama"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email*</label>
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
                    <label className="text-xs text-gray-500">Phone*</label>
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
                    <label className="text-xs text-gray-500">Kewarganegaraan*</label>
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
                      <option>Indonesia</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-navy-900 mb-4">Detail Penumpang</h2>
              <div className="space-y-4">
                {detailPenumpang.map((p, i) => (
                  <div key={i} className="card">
                    <p className="text-sm font-semibold text-navy-900 mb-3">Penumpang {i + 1}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Nama*</label>
                        <input
                          required
                          value={p.nama}
                          onChange={(e) => updateDetail(i, 'nama', e.target.value)}
                          placeholder="Masukkan nama penumpang"
                          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Usia*</label>
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
                        <label className="text-xs text-gray-500">Jenis Kelamin*</label>
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
                        <label className="text-xs text-gray-500">Kewarganegaraan*</label>
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
              <label className="text-sm font-medium text-navy-900">Pesan Tambahan (Opsional)</label>
              <textarea
                rows={4}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-navy-900 resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Simpan Data Penumpang
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-900">Data Penumpang</h2>
                <button
                  onClick={() => setTahap('form')}
                  className="flex items-center gap-1 text-xs text-brand-red font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" /> Ubah Data
                </button>
              </div>
              <div className="card space-y-3">
                {detailPenumpang.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-navy-900">{p.nama}</p>
                      <p className="text-xs text-gray-400">
                        {p.jenisKelamin} · {p.usia} tahun
                      </p>
                    </div>
                    {kursiTerpilih && (
                      <span className="text-xs font-semibold text-navy-900 bg-navy-900/5 rounded-full px-3 py-1">
                        Kursi {kursiTerpilih.nomor[i]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-navy-900 mb-4">Pilih Kursi</h2>
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
                      {kursiTerpilih ? `Kursi ${kursiTerpilih.nomor.join(', ')} dipilih` : 'Belum ada kursi dipilih'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {jumlahKursi} kursi dibutuhkan untuk {jumlahKursi} penumpang
                    </p>
                  </div>
                </div>
                <span className="text-xs text-brand-red font-medium">{kursiTerpilih ? 'Ubah' : 'Pilih Kursi'}</span>
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
              {bookingLoading ? 'Menyimpan...' : 'Lanjut ke Pembayaran'}
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
        onClose={() => setModalOpen(false)}
        onConfirm={handleKonfirmasiKursi}
      />
    </div>
  )
}
