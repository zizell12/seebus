# API SeeBus — Controller & Route

Isi folder ini:
```
app/Http/Controllers/Api/
  AuthController.php       <- register, login, logout, me
  JadwalController.php     <- cari jadwal bus, ambil layout kursi
  WilayahController.php    <- daftar kota
  PesanController.php      <- simpan pesan dari form "Hubungi Kami"
app/Models/
  PesanKontak.php
database/migrations/
  ..._create_pesan_kontak_table.php
routes/
  api.php
```

## Langkah pasang

1. **Copy semua file** ke lokasi yang sama persis di `src/` project Laravel kamu
   (`app/Http/Controllers/Api/`, `app/Models/`, `database/migrations/`, `routes/api.php`).

2. **Cek apakah `routes/api.php` sudah "dikenal" Laravel.** Laravel 11 ke atas,
   file `routes/api.php` **tidak otomatis aktif** — perlu diaktifkan sekali:
   ```powershell
   docker exec -it seebus_app php artisan install:api
   ```
   Kalau muncul pertanyaan "routes/api.php already exists, overwrite?", **pilih No**
   (karena file kamu sudah lebih lengkap dari bawaan). Command ini juga otomatis
   pastikan Sanctum ke-setting dengan benar di `bootstrap/app.php`.

3. **Jalankan migration** (buat tabel `pesan_kontak` yang baru):
   ```powershell
   docker exec -it seebus_app php artisan migrate
   ```

4. **Cek daftar route aktif:**
   ```powershell
   docker exec -it seebus_app php artisan route:list --path=api
   ```
   Harusnya muncul semua endpoint: `/api/register`, `/api/login`, `/api/wilayah`,
   `/api/jadwal`, `/api/jadwal/{id}/kursi`, `/api/pesan`, dll.

## Cara test API (tanpa perlu frontend dulu)

Buka browser, akses langsung (method GET bisa langsung dicoba di address bar):
```
http://seebus.local/api/wilayah
```
Harusnya keluar JSON daftar kota (`Jember`, `Surabaya`, `Malang`, dst — dari seeder kemarin).

```
http://seebus.local/api/jadwal?dari=Jember&tujuan=Surabaya&tanggal=2026-07-15
```
(ganti tanggal sesuai tanggal "hari ini + beberapa hari" karena seeder cuma isi 5 hari ke depan)

Untuk endpoint `POST` (`/api/register`, `/api/login`, `/api/pesan`), tidak bisa dites
langsung di address bar browser — perlu tools seperti **Postman** atau **Thunder Client**
(extension VS Code). Kalau belum ada, bilang saja, nanti aku bantu contoh cara test-nya juga.

## Kenapa `dari`/`tujuan` di endpoint jadwal itu nama KOTA, bukan nama terminal?

Supaya cocok dengan cara React frontend kita kemarin bertanya (dropdown isinya nama kota
seperti "Jember", "Surabaya", bukan nama terminal). Controller ini otomatis "menerjemahkan"
nama kota ke station lewat relasi `route → station → region`.

## Selanjutnya

Setelah API ini kamu tes dan hasilnya sesuai, langkah berikutnya adalah **mengganti
data dummy di React frontend** (`seebus-frontend/src/data/dummyData.js`) dengan
`fetch()` ke endpoint-endpoint ini. Kabari kalau sudah sampai situ, kita lanjut sambungkan.
