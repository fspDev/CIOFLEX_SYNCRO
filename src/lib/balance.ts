import type { Jornada, PagoEmpleado, PagoProyecto, Proyecto } from '../types'

export interface BalanceEmpleado {
  totalGenerado: number
  totalPagado: number
  saldoAdeudado: number
}

/** Ledger derivado: nunca se guarda un booleano/estado, siempre se calcula sumando. */
export function calcularBalanceEmpleado(jornadas: Jornada[], pagos: PagoEmpleado[]): BalanceEmpleado {
  const totalGenerado = jornadas.reduce((acc, j) => acc + j.montoTotal, 0)
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0)
  return { totalGenerado, totalPagado, saldoAdeudado: totalGenerado - totalPagado }
}

export interface BalanceProyecto {
  presupuesto: number
  cobrado: number
  pendiente: number
}

export function calcularBalanceProyecto(proyecto: Proyecto, pagos: PagoProyecto[]): BalanceProyecto {
  const cobrado = pagos.reduce((acc, p) => acc + p.monto, 0)
  return { presupuesto: proyecto.presupuesto, cobrado, pendiente: proyecto.presupuesto - cobrado }
}

export type EstadoPago = 'pendiente' | 'parcial' | 'pagado'

export function estadoPago(total: number, cobrado: number): EstadoPago {
  if (cobrado <= 0) return 'pendiente'
  if (cobrado >= total) return 'pagado'
  return 'parcial'
}

export const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
}

export const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
  pendiente: 'var(--debt)',
  parcial: 'var(--partial)',
  pagado: 'var(--paid)',
}
