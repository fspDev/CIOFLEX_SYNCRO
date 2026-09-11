import { useEffect, useState } from 'react'
import { SlidePanel } from '../../components/ui/SlidePanel'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  actualizarEmpleado,
  eliminarEmpleado,
  listarJornadasPorEmpleado,
  listarPagosPorEmpleado,
  listarTarifas,
} from '../../lib/repo'
import { calcularBalanceEmpleado } from '../../lib/balance'
import { formatCurrency, formatDate, nombreCompleto } from '../../lib/utils'
import type { Empleado, Jornada, PagoEmpleado, TarifaEmpleado } from '../../types'
import { JornadaFormModal } from './JornadaFormModal'
import { PagoEmpleadoFormModal } from './PagoEmpleadoFormModal'
import { TarifaFormModal } from './TarifaFormModal'
import { GenerarAccesoModal } from './GenerarAccesoModal'

interface Props {
  empleado: Empleado
  onClose: () => void
  onChanged: () => void
}

export function EmpleadoDetailPanel({ empleado, onClose, onChanged }: Props) {
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [pagos, setPagos] = useState<PagoEmpleado[]>([])
  const [tarifas, setTarifas] = useState<TarifaEmpleado[]>([])
  const [loading, setLoading] = useState(true)
  const [showJornada, setShowJornada] = useState(false)
  const [jornadaEditando, setJornadaEditando] = useState<Jornada | null>(null)
  const [showPago, setShowPago] = useState(false)
  const [showTarifa, setShowTarifa] = useState(false)
  const [showAcceso, setShowAcceso] = useState(false)

  async function reload() {
    setLoading(true)
    const [j, p, t] = await Promise.all([
      listarJornadasPorEmpleado(empleado.id),
      listarPagosPorEmpleado(empleado.id),
      listarTarifas(empleado.id),
    ])
    setJornadas(j)
    setPagos(p)
    setTarifas(t)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleado.id])

  const balance = calcularBalanceEmpleado(jornadas, pagos)
  const tarifaActual = [...tarifas].sort((a, b) => (a.vigenteDesde < b.vigenteDesde ? 1 : -1))[0]

  async function handleEliminar() {
    if (!confirm(`¿Eliminar a ${nombreCompleto(empleado.nombre, empleado.apellido)}? Esta acción no se puede deshacer.`)) return
    await eliminarEmpleado(empleado.id)
    onChanged()
    onClose()
  }

  async function handleToggleActivo() {
    await actualizarEmpleado(empleado.id, { activo: !empleado.activo })
    onChanged()
  }

  return (
    <SlidePanel open onClose={onClose} title={nombreCompleto(empleado.nombre, empleado.apellido)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div>
            <p>{empleado.telefono || 'Sin teléfono'}</p>
            <p className="text-xs mt-0.5">
              {empleado.authUid ? (
                <span style={{ color: 'var(--paid)' }}>Acceso generado · usuario: {empleado.usuario}</span>
              ) : (
                <span style={{ color: 'var(--partial)' }}>Sin acceso todavía</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="secondary" onClick={() => setShowAcceso(true)}>
              {empleado.authUid ? 'Resetear acceso' : 'Generar acceso'}
            </Button>
            <Button variant="secondary" onClick={handleToggleActivo}>
              {empleado.activo ? 'Marcar inactivo' : 'Marcar activo'}
            </Button>
            <Button variant="danger" onClick={handleEliminar}>
              Eliminar
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Valor de la hora</h3>
            <Button variant="secondary" onClick={() => setShowTarifa(true)}>
              Actualizar
            </Button>
          </div>
          {tarifaActual ? (
            <p className="text-2xl font-semibold">
              {formatCurrency(tarifaActual.valorHora)} <span className="text-sm font-normal text-[var(--text-muted)]">/ hora</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Todavía no se fijó un valor de hora.</p>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Generado</p>
            <p className="font-semibold">{formatCurrency(balance.totalGenerado)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Pagado</p>
            <p className="font-semibold" style={{ color: 'var(--paid)' }}>
              {formatCurrency(balance.totalPagado)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Adeudado</p>
            <p className="font-semibold" style={{ color: balance.saldoAdeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
              {formatCurrency(balance.saldoAdeudado)}
            </p>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Jornadas</h3>
            <Button variant="secondary" onClick={() => setShowJornada(true)}>
              + Cargar jornada
            </Button>
          </div>
          {!tarifaActual && (
            <p className="text-xs mb-3" style={{ color: 'var(--partial)' }}>
              Para cargar jornadas por hora, fijá primero el valor de la hora. Los trabajos por monto fijo no lo necesitan.
            </p>
          )}
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
          ) : jornadas.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin jornadas cargadas.</p>
          ) : (
            <div className="space-y-2">
              {jornadas.map((j) => (
                <Card key={j.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {formatDate(j.fecha)}
                      {j.tipoPago === 'trabajo' ? (
                        <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--partial)' }}>
                          · trabajo
                        </span>
                      ) : (
                        <>
                          {' '}
                          · {j.horas} hs
                          {j.tipoCarga === 'rango' && j.horaInicio && j.horaFin ? ` (${j.horaInicio}–${j.horaFin})` : ''}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{j.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-medium">{formatCurrency(j.montoTotal)}</p>
                    <button
                      onClick={() => setJornadaEditando(j)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      Editar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Pagos realizados</h3>
            <Button variant="secondary" onClick={() => setShowPago(true)}>
              + Registrar pago
            </Button>
          </div>
          {pagos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((p) => (
                <Card key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDate(p.fecha)}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{p.formaPago}</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--paid)' }}>
                    {formatCurrency(p.monto)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <JornadaFormModal open={showJornada} onClose={() => setShowJornada(false)} onSaved={reload} empleadoId={empleado.id} />
      <JornadaFormModal
        open={!!jornadaEditando}
        onClose={() => setJornadaEditando(null)}
        onSaved={reload}
        empleadoId={empleado.id}
        jornada={jornadaEditando ?? undefined}
      />
      <PagoEmpleadoFormModal open={showPago} onClose={() => setShowPago(false)} onSaved={reload} empleadoId={empleado.id} />
      <TarifaFormModal open={showTarifa} onClose={() => setShowTarifa(false)} onSaved={reload} empleadoId={empleado.id} />
      <GenerarAccesoModal open={showAcceso} onClose={() => setShowAcceso(false)} onSaved={reload} empleado={empleado} />
    </SlidePanel>
  )
}
