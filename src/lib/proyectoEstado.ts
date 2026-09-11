import type { EstadoCronologico, Proyecto, TipoServicioProyecto } from '../types'
import { compareDateStr, todayStr } from './utils'

/**
 * Estado cronológico 100% derivado de las fechas cargadas — nunca se edita a mano.
 * Distinto del estado comercial (negociación/confirmado/cancelado), que sí es manual.
 */
export function estadoCronologico(p: Proyecto): EstadoCronologico {
  const hoy = todayStr()

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

export const TIPO_SERVICIO_LABEL: Record<TipoServicioProyecto, string> = {
  armado: 'Armado',
  mantenimiento: 'Mantenimiento',
  construccion: 'Construcción',
}

export const TIPO_SERVICIO_COLOR: Record<TipoServicioProyecto, string> = {
  armado: 'var(--armado)',
  mantenimiento: 'var(--partial)',
  construccion: 'var(--desarme)',
}
