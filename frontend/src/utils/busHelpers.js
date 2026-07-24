export function getFasilitasLabel(kode, t) {
  const map = {
    ac: t.busList.fasilitasAc,
    wifi: t.busList.fasilitasWifi,
    snack: t.busList.fasilitasSnack,
  }
  return map[kode] || kode
}
export function getTipeLabel(kode, t) {
  const map = {
    Sleeper: t.busList.tipeSleeper,
    Eksekutif: t.busList.tipeEksekutif,
    Ekonomi: t.busList.tipeEkonomi,
  }
  return map[kode] || kode
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
