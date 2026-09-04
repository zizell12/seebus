import React, { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { translateToEnglish } from '../utils/autoTranslate'


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
