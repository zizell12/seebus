import React, { createContext, useContext, useState } from 'react'
import { translations } from '../data/translations'
const LanguageContext = createContext(null)
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'id')
  const changeLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }
  const t = translations[lang]
  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: changeLang,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage harus dipakai di dalam LanguageProvider')
  return ctx
}
