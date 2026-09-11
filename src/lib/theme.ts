// Preferencia de tema por dispositivo/navegador (localStorage) — 'sistema' es el default y no
// fuerza el atributo, deja que decida @media (prefers-color-scheme) en index.css.
export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'theme-pref'

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // sin acceso a localStorage (modo privado, etc.) — no rompe nada
  }
  applyThemePref(pref)
}

export function applyThemePref(pref: ThemePref) {
  if (pref === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = pref
}
