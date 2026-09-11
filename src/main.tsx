import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyThemePref, getThemePref } from './lib/theme'

applyThemePref(getThemePref())

// GitHub Pages no tiene rewrite de rutas de SPA: 404.html guarda la ruta pedida
// y redirige acá. Antes de montar el router, la restauramos con replaceState
// para que quede en la URL correcta sin recargar de nuevo.
const redirectPath = sessionStorage.getItem('redirect-path')
if (redirectPath) {
  sessionStorage.removeItem('redirect-path')
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  if (redirectPath !== `${base}/` && redirectPath !== base) {
    window.history.replaceState(null, '', redirectPath)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro del Service Worker — necesario para que la PWA sea instalable.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
