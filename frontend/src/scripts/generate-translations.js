import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// File ini ada di src/scripts/, jadi src/ cuma satu tingkat di atasnya.
const srcDir = path.join(__dirname, '..')
const cachePath = path.join(srcDir, 'data', 'translationsCache.json')

// Opsional: email kontak untuk menaikkan kuota harian MyMemory dari 5.000
// jadi 50.000 karakter/hari. Lihat MYMEMORY_EMAIL di komentar atas.
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || ''

// Batas resmi MyMemory versi anonim: sekitar 1 request/detik. 400ms
// sebelumnya kepotong terlalu cepat sehingga hampir semua request kena
// 429. Dinaikkan jadi 1.2 detik antar-request.
const JEDA_ANTAR_REQUEST_MS = 1200
// Kalau kena 429, tunggu makin lama tiap percobaan ulang (2s, 5s, 12s)
// sebelum nyerah dan lanjut ke teks berikutnya.
const JEDA_RETRY_MS = [2000, 5000, 12000]

function extractStrings(filePath, fieldNames) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const hasil = []
  for (const field of fieldNames) {
    const regex = new RegExp(`${field}: '((?:\\\\.|[^'\\\\])*)'`, 'g')
    let match
    while ((match = regex.exec(content)) !== null) {
      hasil.push(match[1].replace(/\\'/g, "'").replace(/\\"/g, '"'))
    }
  }
  return hasil
}

// Ambil semua nilai string (leaf) dari `translations.id`, termasuk yang
// ada di dalam array (mis. daftar kebijakan/list di beberapa halaman).
async function extractUiStrings() {
  const mod = await import(path.join(srcDir, 'data', 'translations.js'))
  const hasil = []
  function walk(value) {
    if (typeof value === 'string') {
      hasil.push(value)
    } else if (Array.isArray(value)) {
      value.forEach(walk)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk)
    }
  }
  walk(mod.translations.id)
  return hasil
}

// Placeholder seperti '{kota}' / '{halaman}' harus tetap utuh setelah
// diterjemahkan -- lindungi dulu sebelum dikirim ke API, kembalikan
// setelah hasil terjemahan datang. Sama seperti logic di utils/autoTranslate.js.
const PLACEHOLDER_REGEX = /\{([a-zA-Z0-9_]+)\}/g

function protectPlaceholders(text) {
  const map = []
  const protectedText = text.replace(PLACEHOLDER_REGEX, (match) => {
    const token = `Zz${map.length}zZ`
    map.push({ token, original: match })
    return token
  })
  return { protectedText, map }
}

function restorePlaceholders(text, map) {
  let hasil = text
  for (const { token, original } of map) {
    hasil = hasil.replace(new RegExp(token, 'gi'), original)
  }
  return hasil
}

async function translate(text) {
  const { protectedText, map } = protectPlaceholders(text)
  const emailParam = MYMEMORY_EMAIL ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}` : ''
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=id|en${emailParam}`

  // Retry dengan jeda makin lama kalau kena 429 (rate-limit) -- sebelum
  // ini, satu kali gagal langsung dilewati permanen sampai run berikutnya.
  for (let percobaan = 0; ; percobaan++) {
    const res = await fetch(url)

    if (res.status === 429) {
      if (percobaan < JEDA_RETRY_MS.length) {
        await new Promise((r) => setTimeout(r, JEDA_RETRY_MS[percobaan]))
        continue
      }
      throw new Error('HTTP 429 (masih kena limit setelah beberapa kali coba)')
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const hasilMentah = data?.responseData?.translatedText

    // MyMemory tetap balas HTTP 200 walau kuota harian habis, isinya cuma
    // teks peringatan ("MYMEMORY WARNING: ..."). Kalau ini ikut ke-save,
    // translationsCache.json jadi berisi sampah, bukan terjemahan asli.
    if (!hasilMentah || /MYMEMORY WARNING/i.test(hasilMentah) || data?.responseStatus === 403) {
      throw new Error('Kuota/limit layanan translate gratis sedang habis')
    }

    return restorePlaceholders(hasilMentah, map)
  }
}

async function main() {
  const teksDummyData = extractStrings(path.join(srcDir, 'data', 'dummyData.js'), ['deskripsi', 'desk'])
  const teksWilayah = extractStrings(path.join(srcDir, 'data', 'wilayahData.js'), ['keterangan'])
  const teksUi = await extractUiStrings()
  const semuaTeks = [...new Set([...teksDummyData, ...teksWilayah, ...teksUi])]

  let cache = {}
  if (fs.existsSync(cachePath)) {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
  }

  const belumAda = semuaTeks.filter((t) => !cache[t])
  console.log(`Total teks: ${semuaTeks.length}, sudah di-cache: ${semuaTeks.length - belumAda.length}, perlu translate: ${belumAda.length}`)
  if (MYMEMORY_EMAIL) console.log(`Pakai email kontak (kuota 50.000 karakter/hari): ${MYMEMORY_EMAIL}`)

  let jumlahBerhasil = 0
  let jumlahGagal = 0

  for (const [i, teks] of belumAda.entries()) {
    try {
      cache[teks] = await translate(teks)
      jumlahBerhasil++
      console.log(`[${i + 1}/${belumAda.length}] OK: ${teks.slice(0, 50)}...`)
    } catch (err) {
      jumlahGagal++
      console.warn(`[${i + 1}/${belumAda.length}] GAGAL (dilewati, coba lagi run berikutnya): ${teks.slice(0, 50)}... (${err.message})`)
    }

    if ((i + 1) % 20 === 0) {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
    }

    await new Promise((r) => setTimeout(r, JEDA_ANTAR_REQUEST_MS))
  }

  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
  console.log(`Selesai. Berhasil: ${jumlahBerhasil}, gagal: ${jumlahGagal}. Cache tersimpan di ${cachePath}`)

  if (jumlahGagal > 0) {
    console.log(
      `\n${jumlahGagal} teks masih gagal (kemungkinan kuota harian MyMemory habis). ` +
        `Jalankan lagi perintah yang sama nanti/besok -- teks yang sudah berhasil tidak akan diulang.`
    )
  }
}

main()
