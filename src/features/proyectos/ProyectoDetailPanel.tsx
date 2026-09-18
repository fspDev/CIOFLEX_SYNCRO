import { useEffect, useMemo, useState } from 'react'
import { SlidePanel } from '../../components/ui/SlidePanel'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SortToggle, type Orden } from '../../components/ui/SortToggle'
import { Collapsible } from '../../components/ui/Collapsible'
import { eliminarPagoProyecto, eliminarProyecto, listarClientes, listarEmpleados, listarPagosPorProyecto } from '../../lib/repo'
import { calcularBalanceProyecto, estadoPago, ESTADO_PAGO_COLOR, ESTADO_PAGO_LABEL } from '../../lib/balance'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
import { compareDateStr, formatCurrency, formatDate, nombreCompleto } from '../../lib/utils'
import type { Cliente, Empleado, PagoProyecto, Proyecto } from '../../types'
import { PagoProyectoFormModal } from './PagoProyectoFormModal'
import { ProyectoFormModal } from './ProyectoFormModal'

interface Props {
  proyecto: Proyecto
  onClose: () => void
  onChanged: () => void
}

export function ProyectoDetailPanel({ proyecto, onClose, onChanged }: Props) {
  const [pagos, setPagos] = useState<PagoProyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [showPago, setShowPago] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [ordenPagos, setOrdenPagos] = useState<Orden>('desc')
  const [ordenAsignaciones, setOrdenAsignaciones] = useState<Orden>('asc')

  async function reload() {
    const [p, c, e] = await Promise.all([listarPagosPorProyecto(proyecto.id), listarClientes(), listarEmpleados()])
    setPagos(p)
    setClientes(c)
    setEmpleados(e)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.id])

  const balance = calcularBalanceProyecto(proyecto, pagos)
  const estado = estadoPago(balance.presupuesto, balance.cobrado)
  const cronologico = estadoCronologico(proyecto)
  const cliente = clientes.find((c) => c.id === proyecto.clienteId)

  const pagosOrdenados = useMemo(
    () => [...pagos].sort((a, b) => (ordenPagos === 'asc' ? compareDateStr(a.fecha, b.fecha) : compareDateStr(b.fecha, a.fecha))),
    [pagos, ordenPagos],
  )

  const diasAsignados = useMemo(() => {
    const dias = [...new Set((proyecto.asignaciones ?? []).map((a) => a.fecha))]
    return dias.sort((a, b) => (ordenAsignaciones === 'asc' ? compareDateStr(a, b) : compareDateStr(b, a)))
  }, [proyecto.asignaciones, ordenAsignaciones])

  async function handleEliminar() {
    if (!confirm(`¿Eliminar el proyecto "${proyecto.nombre}"?`)) return
    await eliminarProyecto(proyecto.id)
    onChanged()
    onClose()
  }

  async function handleEliminarPago(id: string) {
    if (!confirm('¿Eliminar este cobro?')) return
    await eliminarPagoProyecto(id)
    reload()
  }

  return (
    <SlidePanel open onClose={onClose} title={proyecto.nombre}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge color="var(--brand-500)">{proyecto.tipoServicio}</Badge>
            <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
            <Badge color={ESTADO_PAGO_COLOR[estado]}>{ESTADO_PAGO_LABEL[estado]}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Editar
            </Button>
            <Button variant="danger" onClick={handleEliminar}>
              Eliminar
            </Button>
          </div>
        </div>

        <Card className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Cliente</span>
            <span className="font-medium">{cliente?.nombre ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Ubicación</span>
            <span className="font-medium">{proyecto.ubicacion}</span>
          </div>
          {proyecto.diasTrabajo && proyecto.diasTrabajo.length > 0 ? (
            <div className="flex justify-between gap-3">
              <span className="text-[var(--text-muted)] shrink-0">Días de trabajo</span>
              <span className="font-medium text-right">{proyecto.diasTrabajo.map((d) => formatDate(d)).join(', ')}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Armado</span>
                <span className="font-medium">{formatDate(proyecto.fechaArmadoInicio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Evento</span>
                <span className="font-medium">
                  {formatDate(proyecto.fechaEventoInicio)}
                  {proyecto.fechaEventoFin ? ` – ${formatDate(proyecto.fechaEventoFin)}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Desarme</span>
                <span className="font-medium">{formatDate(proyecto.fechaDesarmeInicio)}</span>
              </div>
            </>
          )}
        </Card>

        <Collapsible title="Balance">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Presupuestado</p>
              <p className="font-semibold">{formatCurrency(balance.presupuesto)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Cobrado</p>
              <p className="font-semibold" style={{ color: 'var(--paid)' }}>
                {formatCurrency(balance.cobrado)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Pendiente</p>
              <p className="font-semibold" style={{ color: balance.pendiente > 0 ? 'var(--debt)' : 'var(--paid)' }}>
                {formatCurrency(balance.pendiente)}
              </p>
            </Card>
          </div>
        </Collapsible>

        <div>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="font-medium text-sm">Cobros</h3>
            <div className="flex items-center gap-2">
              <SortToggle orden={ordenPagos} onChange={setOrdenPagos} label="Fecha" />
              <Button variant="secondary" onClick={() => setShowPago(true)}>
                + Registrar cobro
              </Button>
            </div>
          </div>
          {pagos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin cobros registrados.</p>
          ) : (
            <div className="space-y-2">
              {pagosOrdenados.map((p) => (
                <Card key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDate(p.fecha)}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{p.formaPago}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium" style={{ color: 'var(--paid)' }}>
                      {formatCurrency(p.monto)}
                    </p>
                    <button onClick={() => handleEliminarPago(p.id)} className="text-[var(--text-muted)] hover:text-red-400 text-xs">
                      Eliminar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Empleados asignados por día</h3>
            {diasAsignados.length > 0 && <SortToggle orden={ordenAsignaciones} onChange={setOrdenAsignaciones} label="Fecha" />}
          </div>
          {diasAsignados.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin empleados asignados.</p>
          ) : (
            <div className="space-y-3">
              {diasAsignados.map((dia) => (
                <div key={dia}>
                  <p className="text-xs text-[var(--text-muted)] mb-1.5">{formatDate(dia)}</p>
                  <div className="space-y-1.5">
                    {(proyecto.asignaciones ?? [])
                      .filter((a) => a.fecha === dia)
                      .map((a, idx) => {
                        const emp = empleados.find((e) => e.id === a.empleadoId)
                        return (
                          <Card key={idx} className="p-3 flex items-center justify-between">
                            <span className="text-sm">{emp ? nombreCompleto(emp.nombre, emp.apellido) : 'Empleado eliminado'}</span>
                            {a.horaInicio && a.horaFin && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {a.horaInicio}–{a.horaFin}
                              </span>
                            )}
                          </Card>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PagoProyectoFormModal open={showPago} onClose={() => setShowPago(false)} onSaved={reload} proyectoId={proyecto.id} />
      <ProyectoFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={onChanged}
        proyecto={proyecto}
      />
    </SlidePanel>
  )
}
