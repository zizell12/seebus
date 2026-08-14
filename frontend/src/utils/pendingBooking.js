// Menyimpan jejak booking pending milik BROWSER INI di localStorage, supaya
// Navbar bisa menampilkan tombol "Lanjutkan Pembayaran" hanya ketika memang
// relevan (baru saja bikin booking di browser ini dan belum bayar/kadaluwarsa),
// bukan selalu tampil untuk semua orang seperti link statis di footer.
//
// Catatan: ini cuma sinyal UI di sisi browser (bukan sumber kebenaran) -
// validasi sebenarnya (booking masih pending & belum expired) tetap dicek ke
// backend lewat api.lookupBooking saat tombolnya diklik / halaman
// LanjutkanPembayaran dibuka.
const STORAGE_KEY = 'seebus_pending_booking'

export function savePendingBooking({ code, expiresAt }) {
  if (!code || !expiresAt) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, expiresAt }))
    window.dispatchEvent(new Event('seebus-pending-booking-changed'))
  } catch {
    // localStorage bisa gagal (mode private/incognito penuh, dsb) - abaikan,
    // ini cuma UI hint, bukan fitur inti.
  }
}

export function getPendingBooking() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.code || !data?.expiresAt || new Date(data.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearPendingBooking() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('seebus-pending-booking-changed'))
  } catch {
    // no-op
  }
}
