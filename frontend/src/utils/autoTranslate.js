import staticCache from '../data/translationsCache.json'

const CACHE_KEY = 'seebus_auto_translate_cache_v1'

const UI_TREE_CACHE_KEY = 'seebus_auto_translate_ui_tree_v2'

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage penuh / tidak tersedia -- translate tetap jalan,
    // cuma hasilnya tidak ke-cache untuk kunjungan berikutnya.
  }
}

const PLACEHOLDER_REGEX = /\{([a-zA-Z0-9_]+)\}/g

function protectPlaceholders(text) {
  const map = []
  const protectedText = text.replace(PLACEHOLDER_REGEX, (match, name) => {
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

async function callTranslateApi(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=id|en`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal menghubungi layanan translate')
  const data = await res.json()
  const hasil = data?.responseData?.translatedText

  // semacam "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS...".
  if (!hasil || /MYMEMORY WARNING/i.test(hasil) || data?.responseStatus === 403) {
    throw new Error('Kuota/limit layanan translate gratis sedang habis')
  }

  return hasil
}

export async function translateToEnglish(text) {
  if (!text) return text

  // Cek cache hasil generate (scripts/generate-translations.js) dulu --
  // instan, tanpa nunggu API. Kalau belum ada di sini (mis. teks baru yang
  // belum di-generate), baru fallback ke cache localStorage / API live.
  if (staticCache[text]) return staticCache[text]

  const cache = loadCache()
  if (cache[text]) return cache[text]

  const { protectedText, map } = protectPlaceholders(text)
  const hasilMentah = await callTranslateApi(protectedText)
  const hasil = restorePlaceholders(hasilMentah, map)

  cache[text] = hasil
  saveCache(cache)

  return hasil
}

function loadUiTreeCache() {
  try {
    return JSON.parse(localStorage.getItem(UI_TREE_CACHE_KEY)) || null
  } catch {
    return null
  }
}

function saveUiTreeCache(tree) {
  try {
    localStorage.setItem(UI_TREE_CACHE_KEY, JSON.stringify(tree))
  } catch {
    // abaikan kalau localStorage penuh -- translate tetap jalan tiap kali
  }
}

// Jalankan beberapa translate sekaligus, tapi dibatasi jumlahnya supaya
// tidak kena rate-limit API gratis MyMemory.
async function withConcurrencyLimit(items, limit, worker) {
  const hasil = new Array(items.length)
  let index = 0
  async function next() {
    while (index < items.length) {
      const current = index++
      hasil[current] = await worker(items[current], current)
    }
  }
  const jumlahWorker = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: jumlahWorker }, next))
  return hasil
}

/**
 * Terjemahkan seluruh pohon objek teks UI (mis. `translations.id`) ke
 * bahasa Inggris secara otomatis, tanpa perlu ada objek `en` yang ditulis
 * manual. Struktur objek (nested object / array of string) dipertahankan,
 * hanya nilai string di ujungnya yang diterjemahkan.
 *
 * Hasilnya di-cache ke localStorage (per browser) supaya panggilan
 * berikutnya instan. Kalau ingin hasil ini sudah tersedia sejak load
 * pertama (tanpa nunggu API sama sekali), jalankan
 * `node scripts/generate-translations.js` supaya masuk ke
 * `translationsCache.json` yang di-bundle bareng aplikasi.
 */
export async function translateTree(node, { useCache = true, concurrency = 3 } = {}) {
  if (useCache) {
    const cached = loadUiTreeCache()
    if (cached) return cached
  }

  // Kumpulkan semua string leaf dulu (biar bisa ditranslate paralel),
  // sambil menyimpan "jalan" (path) balik ke posisinya di objek hasil.
  const jobs = []

  function walk(value) {
    if (typeof value === 'string') {
      const jobIndex = jobs.length
      jobs.push(value)
      return { __jobIndex: jobIndex }
    }
    if (Array.isArray(value)) {
      return value.map(walk)
    }
    if (value && typeof value === 'object') {
      const hasil = {}
      for (const key of Object.keys(value)) {
        hasil[key] = walk(value[key])
      }
      return hasil
    }
    return value
  }

  const kerangka = walk(node)

  const teksUnik = [...new Set(jobs)]
  const hasilUnik = new Map()
  let semuaBerhasil = true

  await withConcurrencyLimit(teksUnik, concurrency, async (teks) => {
    try {
      hasilUnik.set(teks, await translateToEnglish(teks))
    } catch {
      semuaBerhasil = false
      // Fallback: tampilkan teks Indonesia apa adanya untuk yang gagal,
      // supaya UI tidak rusak/kosong.
      hasilUnik.set(teks, teks)
    }
  })

  const hasilTranslate = jobs.map((teks) => hasilUnik.get(teks))

  function isi(value) {
    if (value && typeof value === 'object' && '__jobIndex' in value) {
      return hasilTranslate[value.__jobIndex]
    }
    if (Array.isArray(value)) {
      return value.map(isi)
    }
    if (value && typeof value === 'object') {
      const hasil = {}
      for (const key of Object.keys(value)) {
        hasil[key] = isi(value[key])
      }
      return hasil
    }
    return value
  }

  const treeJadi = isi(kerangka)

  if (useCache && semuaBerhasil) saveUiTreeCache(treeJadi)

  return treeJadi
}
