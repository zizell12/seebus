import React, { useEffect, useRef, useState } from 'react'
import { Users, Minus, Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// value: { dewasa: number, anak: number, bayi: number }
// onChange: (value) => void
export default function PenumpangPicker({ value, onChange }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Tutup popup kalau user klik di luar area komponen ini
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const total = value.dewasa + value.anak + value.bayi

  const ubah = (kategori, delta) => {
    const nilaiBaru = value[kategori] + delta

    if (kategori === 'dewasa' && nilaiBaru < 1) return // minimal 1 dewasa
    if (nilaiBaru < 0) return
    if (total + delta > 10) return // batas wajar 1 kali booking

    onChange({ ...value, [kategori]: nilaiBaru })
  }

  const kategoriList = [
    { key: 'dewasa', label: t.search.dewasa, ket: t.search.dewasaKet },
    { key: 'anak', label: t.search.anak, ket: t.search.anakKet },
    { key: 'bayi', label: t.search.bayi, ket: t.search.bayiKet },
  ]

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 text-xs text-gray-400 mb-0.5"
      >
        <Users className="w-4 h-4" /> {t.search.penumpang}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left text-sm text-navy-900 outline-none"
      >
        {total} {t.search.orangSingular}
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border p-4">
          {kategoriList.map((k) => (
            <div key={k.key} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-navy-900">{k.label}</p>
                <p className="text-xs text-gray-400">{k.ket}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => ubah(k.key, -1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy-900"
                  disabled={k.key === 'dewasa' ? value[k.key] <= 1 : value[k.key] <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-semibold text-navy-900">{value[k.key]}</span>
                <button
                  type="button"
                  onClick={() => ubah(k.key, 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-primary w-full mt-3 text-sm"
          >
            {t.search.selesai}
          </button>
        </div>
      )}
    </div>
  )
}
