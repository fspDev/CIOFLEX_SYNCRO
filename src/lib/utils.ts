// Helpers centralizados de formato — todo el resto de la app importa de acá,
// nunca reimplementa formateo de fecha/moneda por pantalla.

/** Resuelve una ruta de public/ contra el base path del deploy (GitHub Pages sirve bajo /cioflex-syncro/). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

/** 'YYYY-MM-DD' de hoy, en horario local (nunca UTC). */
export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Primer día del mes de una fecha 'YYYY-MM-DD', como 'YYYY-MM-01'. */
export function monthStartOf(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

/** Compara fechas-string 'YYYY-MM-DD' lexicográficamente (funciona porque el formato es fixed-width). */
export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Formatea 'YYYY-MM-DD' a 'DD/MM/YYYY' para mostrar en UI. */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0)
}

/** Separador de miles en vivo mientras se tipea (ej. '23.000'), sin símbolo de moneda. */
export function formatThousands(value: number | string): string {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('es-AR').format(Number(digits))
}

export function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Diferencia en horas (decimal) entre dos 'HH:mm'. Soporta turnos que cruzan medianoche. */
export function hoursBetween(horaInicio: string, horaFin: string): number {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFin.split(':').map(Number)
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1)
  if (minutos < 0) minutos += 24 * 60
  return Math.round((minutos / 60) * 100) / 100
}

export function nombreCompleto(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.trim()
}

export function initials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

// URL pública de la PWA en GitHub Pages (ver `base` en vite.config.ts, tiene que coincidir).
export const APP_URL = 'https://fspdev.github.io/CIOFLEX_SYNCRO/'

export function textoAccesoEmpleado(usuario: string, password: string): string {
  return `Usuario: ${usuario}\nContraseña: ${password}\n${APP_URL}`
}

/** Copia al portapapeles; devuelve si funcionó (puede fallar en contextos sin permiso/HTTPS). */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
