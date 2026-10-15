export function getFasilitasLabel(kode, t) {
  const map = {
    ac: t.busList.fasilitasAc,
    wifi: t.busList.fasilitasWifi,
    snack: t.busList.fasilitasSnack,
  }
  return map[kode] || kode
}
// Data nama di database selalu huruf kecil (lihat NormalizesCase di backend),
// jadi tampilan harus dikapitalisasi di sini. "terminal tawang alun" -> "Terminal Tawang Alun".
export function kapitalisasi(teks) {
  return String(teks || '').replace(/(^|[\s(-])(\p{L})/gu, (_, awal, huruf) => awal + huruf.toUpperCase())
}
export function getTipeLabel(kode, t) {
  const map = {
    sleeper: t.busList.tipeSleeper,
    eksekutif: t.busList.tipeEksekutif,
    ekonomi: t.busList.tipeEkonomi,
  }
  return map[String(kode || '').toLowerCase()] || kapitalisasi(kode)
}
export function getWaktuKategoriLabel(kode, t) {
  const map = {
    pagi: t.busList.waktuPagi,
    'siang-sore': t.busList.waktuSiangSore,
    malam: t.busList.waktuMalam,
    'dini-hari': t.busList.waktuDiniHari,
  }
  return map[kode] || kode
}
export function getTipeTerminalLabel(kode, t) {
  const map = {
    'Tipe A': t.wilayah.tipeTerminalA,
    'Tipe B': t.wilayah.tipeTerminalB,
    'Tipe C': t.wilayah.tipeTerminalC,
  }
  return map[kode] || kode
}