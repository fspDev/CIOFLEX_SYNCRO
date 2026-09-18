import { useEffect, useMemo, useState } from 'react'
import { SlidePanel } from '../../components/ui/SlidePanel'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SortToggle, type Orden } from '../../components/ui/SortToggle'
import { eliminarCliente, listarPagosPorProyecto, listarProyectosPorCliente } from '../../lib/repo'
import { calcularBalanceProyecto } from '../../lib/balance'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
import { compareDateStr, formatCurrency, formatDate } from '../../lib/utils'
import type { Cliente, PagoProyecto, Proyecto } from '../../types'
import { ClienteFormModal } from './ClienteFormModal'
import { ProyectoDetailPanel } from '../proyectos/ProyectoDetailPanel'

interface Props {
  cliente: Cliente
  onClose: () => void
  onChanged: () => void
}

export function ClienteDetailPanel({ cliente, onClose, onChanged }: Props) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [pagosPorProyecto, setPagosPorProyecto] = useState<Record<string, PagoProyecto[]>>({})
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [selected, setSelected] = useState<Proyecto | null>(null)
  const [orden, setOrden] = useState<Orden>('desc')

  async function reload() {
    setLoading(true)
    const p = await listarProyectosPorCliente(cliente.id)
    setProyectos(p)
    const entries = await Promise.all(p.map(async (pr) => [pr.id, await listarPagosPorProyecto(pr.id)] as const))
    setPagosPorProyecto(Object.fromEntries(entries))
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id])

  const ordenados = useMemo(() => {
    return [...proyectos].sort((a, b) => {
      const fa = a.fechaEventoInicio ?? a.diasTrabajo?.[0] ?? ''
      const fb = b.fechaEventoInicio ?? b.diasTrabajo?.[0] ?? ''
      return orden === 'asc' ? compareDateStr(fa, fb) : compareDateStr(fb, fa)
    })
  }, [proyectos, orden])

  const totales = useMemo(() => {
    return proyectos.reduce(
      (acc, p) => {
        const b = calcularBalanceProyecto(p, pagosPorProyecto[p.id] ?? [])
        return { presupuestado: acc.presupuestado + b.presupuesto, cobrado: acc.cobrado + b.cobrado, pendiente: acc.pendiente + b.pendiente }
      },
      { presupuestado: 0, cobrado: 0, pendiente: 0 },
    )
  }, [proyectos, pagosPorProyecto])

  async function handleEliminar() {
    if (!confirm(`¿Eliminar a ${cliente.nombre}?`)) return
    await eliminarCliente(cliente.id)
    onChanged()
    onClose()
  }

  return (
    <SlidePanel open onClose={onClose} title={cliente.nombre}>
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div>
            <p>{cliente.telefono || 'Sin teléfono'}</p>
            <p>{cliente.email || 'Sin email'}</p>
            {cliente.notas && <p className="text-xs mt-1">{cliente.notas}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Editar
            </Button>
            <Button variant="danger" onClick={handleEliminar}>
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Presupuestado</p>
            <p className="font-semibold">{loading ? '…' : formatCurrency(totales.presupuestado)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Cobrado</p>
            <p className="font-semibold" style={{ color: 'var(--paid)' }}>
              {loading ? '…' : formatCurrency(totales.cobrado)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Pendiente</p>
            <p className="font-semibold" style={{ color: totales.pendiente > 0 ? 'var(--debt)' : 'var(--paid)' }}>
              {loading ? '…' : formatCurrency(totales.pendiente)}
            </p>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Historial de trabajos</h3>
            <SortToggle orden={orden} onChange={setOrden} label="Fecha" />
          </div>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
          ) : ordenados.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Todavía no hay proyectos con este cliente.</p>
          ) : (
            <div className="space-y-2">
              {ordenados.map((p) => {
                const balance = calcularBalanceProyecto(p, pagosPorProyecto[p.id] ?? [])
                const cronologico = estadoCronologico(p)
                return (
                  <Card
                    key={p.id}
                    className="p-3 cursor-pointer hover:border-[var(--brand-500)] transition-colors"
                    onClick={() => setSelected(p)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.nombre}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDate(p.fechaEventoInicio ?? p.diasTrabajo?.[0])} · {p.tipoServicio}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">{formatCurrency(balance.presupuesto)}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ClienteFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={onChanged} cliente={cliente} />
      {selected && <ProyectoDetailPanel proyecto={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </SlidePanel>
  )
}
