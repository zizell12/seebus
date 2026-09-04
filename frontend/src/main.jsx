import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import './index.css'

const SESSION_KEY = 'seebus_session_active'
const isNewSession = !sessionStorage.getItem(SESSION_KEY)
if (isNewSession && window.location.pathname === '/pencarian' && window.location.search) {
  window.history.replaceState({}, '', window.location.pathname)
}
sessionStorage.setItem(SESSION_KEY, '1')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
