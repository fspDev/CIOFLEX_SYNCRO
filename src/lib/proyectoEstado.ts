import type { EstadoCronologico, Proyecto } from '../types'
import { compareDateStr, todayStr } from './utils'

/**
 * Estado cronológico 100% derivado de las fechas cargadas — nunca se edita a mano.
 * Distinto del estado comercial (negociación/confirmado/cancelado), que sí es manual.
 *
 * Proyectos con fases de armado: usan armado/evento/desarme. Resto de proyectos: usan
 * `diasTrabajo`, una lista de días sueltos no necesariamente consecutivos — el estado se
 * deriva del primer y último día de esa lista.
 */
export function estadoCronologico(p: Proyecto): EstadoCronologico {
  const hoy = todayStr()

  if (p.diasTrabajo && p.diasTrabajo.length > 0) {
    const dias = [...p.diasTrabajo].sort(compareDateStr)
    const primero = dias[0]
    const ultimo = dias[dias.length - 1]
    if (compareDateStr(hoy, ultimo) > 0) return 'finalizado'
    if (compareDateStr(hoy, primero) >= 0) return 'en_curso'
    return 'en_desarrollo'
  }

  const inicioArmado = p.fechaArmadoInicio
  const inicioEvento = p.fechaEventoInicio
  const finEvento = p.fechaEventoFin ?? p.fechaEventoInicio
  const inicioDesarme = p.fechaDesarmeInicio
  const finDesarme = p.fechaDesarmeFin ?? p.fechaDesarmeInicio

  if (finDesarme && compareDateStr(hoy, finDesarme) > 0) return 'finalizado'
  if (!finDesarme && finEvento && compareDateStr(hoy, finEvento) > 0) return 'finalizado'

  if (inicioDesarme && compareDateStr(hoy, inicioDesarme) >= 0) return 'desarme'
  if (inicioEvento && finEvento && compareDateStr(hoy, inicioEvento) >= 0 && compareDateStr(hoy, finEvento) <= 0) {
    return 'en_curso'
  }
  if (inicioArmado && compareDateStr(hoy, inicioArmado) >= 0) return 'armado'

  return 'en_desarrollo'
}

/** Todos los días 'YYYY-MM-DD' entre inicio y fin (inclusive). Sirve para expandir un rango. */
export function diasEnRango(inicio?: string, fin?: string): string[] {
  if (!inicio) return []
  const [y1, m1, d1] = inicio.split('-').map(Number)
  const [y2, m2, d2] = (fin ?? inicio).split('-').map(Number)
  const cur = new Date(y1, m1 - 1, d1)
  const end = new Date(y2, m2 - 1, d2)
  const dias: string[] = []
  while (cur <= end) {
    dias.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

/** Días concretos de las fases armado/evento/desarme, sin duplicados y ordenados. */
export function diasDeFasesArmado(fechas: {
  fechaArmadoInicio?: string
  fechaEventoInicio?: string
  fechaEventoFin?: string
  fechaDesarmeInicio?: string
  fechaDesarmeFin?: string
}): string[] {
  const dias = new Set<string>()
  diasEnRango(fechas.fechaArmadoInicio, fechas.fechaArmadoInicio).forEach((d) => dias.add(d))
  diasEnRango(fechas.fechaEventoInicio, fechas.fechaEventoFin).forEach((d) => dias.add(d))
  diasEnRango(fechas.fechaDesarmeInicio, fechas.fechaDesarmeFin).forEach((d) => dias.add(d))
  return [...dias].sort(compareDateStr)
}

/** Todos los días concretos que ocupa el proyecto (para calendario y asignación por día). */
export function diasDelProyecto(p: Proyecto): string[] {
  if (p.diasTrabajo && p.diasTrabajo.length > 0) {
    return [...p.diasTrabajo].sort(compareDateStr)
  }
  return diasDeFasesArmado(p)
}

export const ESTADO_CRONOLOGICO_LABEL: Record<EstadoCronologico, string> = {
  en_desarrollo: 'En desarrollo',
  armado: 'Armado',
  en_curso: 'En curso',
  desarme: 'Desarme',
  finalizado: 'Finalizado',
}

export const ESTADO_CRONOLOGICO_COLOR: Record<EstadoCronologico, string> = {
  en_desarrollo: 'var(--text-muted)',
  armado: 'var(--armado)',
  en_curso: 'var(--brand-500)',
  desarme: 'var(--desarme)',
  finalizado: 'var(--paid)',
}
