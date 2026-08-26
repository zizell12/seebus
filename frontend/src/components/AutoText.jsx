import React, { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { translateToEnglish } from '../utils/autoTranslate'

/**
 * Menampilkan `text` (bahasa Indonesia) apa adanya saat lang === 'id',
 * atau otomatis diterjemahkan ke Inggris saat lang === 'en' -- tanpa
 * perlu nulis versi Inggrisnya manual di data dummy.
 *
 * Kalau translate gagal/limit API kepakai, jatuh balik nampilin teks
 * Indonesia apa adanya (bukan kosong), jadi UI tidak pernah rusak.
 */
export default function AutoText({ text, as: Tag = 'p', className }) {
  const { lang } = useLanguage()
  const [tampil, setTampil] = useState(text)

  useEffect(() => {
    if (lang !== 'en') {
      setTampil(text)
      return
    }

    let batal = false
    translateToEnglish(text)
      .then((hasil) => {
        if (!batal) setTampil(hasil)
      })
      .catch(() => {
        if (!batal) setTampil(text)
      })

    return () => {
      batal = true
    }
  }, [text, lang])

  return <Tag className={className}>{tampil}</Tag>
}
