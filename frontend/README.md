# SeeBus — Frontend (React + Vite + Tailwind)

Frontend untuk sistem pemesanan tiket bus SeeBus, sesuai desain yang kamu buat.

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Struktur Halaman & Alur

```
/                        -> Beranda (hero + form cari tiket)
/wilayah                 -> Daftar kota/wilayah layanan
/perusahaan               -> Tentang perusahaan
/hubungi-kami             -> Form kontak -> kirim pesan ke perusahaan
/kebijakan-perjalanan     -> Kebijakan perjalanan
/pusat-bantuan             -> FAQ
/masuk, /daftar            -> Autentikasi

Alur pemesanan tiket:
/pencarian                     -> hasil pencarian & pilih kategori bus
/pemesanan/kursi               -> pilih kursi
/pemesanan/penumpang           -> isi data penumpang
/pemesanan/pembayaran          -> ringkasan + popup PayPal (simulasi)
/pemesanan/berhasil            -> konfirmasi pembayaran berhasil

/dashboard                     -> dashboard customer (profil, tiket, riwayat)
```

State alur booking (kota asal/tujuan, bus dipilih, kursi, data penumpang, status bayar)
disimpan di `src/context/BookingContext.jsx` dan mengalir otomatis antar halaman.

Semua data saat ini masih dummy (`src/data/dummyData.js`). Titik-titik yang perlu
disambungkan ke API sudah ditandai komentar `// TODO: sambungkan ke Laravel`.

---

## Panduan Backend Laravel + Database

Karena kamu bilang database sudah dibuat, sesuaikan skema ini dengan yang sudah ada.
Berikut struktur tabel & endpoint yang disarankan agar cocok dengan frontend ini.

### 1. Tabel Database (migration)

| Tabel | Kolom penting |
|---|---|
| `users` | id, nama, email, password, no_telepon, created_at |
| `kota` | id, nama_kota |
| `perusahaan_otobus` (PO) | id, nama_po |
| `armada` | id, po_id (FK), kategori (economy/executive/suite), jumlah_kursi, fasilitas (json) |
| `jadwal` | id, armada_id (FK), kota_asal_id (FK), kota_tujuan_id (FK), tanggal_berangkat, jam_berangkat, jam_tiba, harga |
| `kursi` | id, jadwal_id (FK), kode_kursi (A1, A2, ...), status (tersedia/terisi) |
| `pemesanan` | id, user_id (FK), jadwal_id (FK), kode_booking, total_bayar, status (pending/success/failed), created_at |
| `pemesanan_penumpang` | id, pemesanan_id (FK), kursi_id (FK), nama, nik, jenis_kelamin |
| `pembayaran` | id, pemesanan_id (FK), metode (paypal), paypal_order_id, status, paid_at |
| `pesan_kontak` | id, nama, email, pesan, created_at (dari form Hubungi Kami) |

Gunakan `php artisan make:migration` untuk tiap tabel, dan Eloquent relationship
(`hasMany`/`belongsTo`) sesuai FK di atas.

### 2. Endpoint API yang perlu dibuat (disarankan pakai Laravel Sanctum untuk auth)

```
POST   /api/register
POST   /api/login
POST   /api/logout

GET    /api/kota                          -> daftar kota (untuk dropdown Dari/Tujuan)
GET    /api/jadwal?dari=&tujuan=&tanggal=  -> hasil pencarian bus
GET    /api/jadwal/{id}/kursi              -> layout kursi & status terisi/tersedia

POST   /api/pemesanan                      -> buat pemesanan (kursi + data penumpang)
POST   /api/pembayaran/paypal/create       -> buat order PayPal, return order id
POST   /api/pembayaran/paypal/capture      -> verifikasi pembayaran setelah popup PayPal selesai

GET    /api/user                           -> data profil (untuk dashboard)
GET    /api/pemesanan/saya                 -> riwayat & tiket aktif user (untuk dashboard)

POST   /api/pesan                          -> simpan pesan dari form Hubungi Kami
```

### 3. Integrasi PayPal (menggantikan popup simulasi)

Di `Pembayaran.jsx`, popup saat ini murni simulasi (`setTimeout`). Untuk produksi:

1. Install PayPal JS SDK di `index.html`:
   `<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>`
2. Backend Laravel buat order via PayPal REST API (`/v2/checkout/orders`), kembalikan `order_id` ke frontend lewat `POST /api/pembayaran/paypal/create`.
3. Frontend render `paypal.Buttons()` di dalam modal, bukan tombol simulasi.
4. Setelah user approve di popup PayPal, frontend kirim `order_id` ke `POST /api/pembayaran/paypal/capture` agar backend capture pembayaran & update status `pemesanan`/`pembayaran` di database.
5. Baru setelah backend konfirmasi sukses, redirect ke `/pemesanan/berhasil`.

### 4. Autentikasi

Ganti simulasi `setTimeout` di `Masuk.jsx` dan `Daftar.jsx` dengan `fetch`/`axios` ke
endpoint di atas, simpan token Sanctum (misal di `localStorage` atau httpOnly cookie
kalau pakai Sanctum SPA mode), lalu buat `AuthContext` sederhana mirip `BookingContext`
untuk menyimpan status login & data user di seluruh halaman (termasuk untuk proteksi
route `/dashboard`).

### 5. CORS

Pastikan `config/cors.php` di Laravel mengizinkan origin frontend (`http://localhost:5173`
saat development, domain produksi saat deploy), dan set `SANCTUM_STATEFUL_DOMAINS` kalau
pakai Sanctum SPA authentication.
