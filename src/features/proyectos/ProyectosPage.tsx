import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { listarClientes, listarPagosPorProyecto, listarProyectos } from '../../lib/repo'
import { calcularBalanceProyecto, estadoPago, ESTADO_PAGO_COLOR, ESTADO_PAGO_LABEL } from '../../lib/balance'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
import { compareDateStr, formatCurrency, formatDate } from '../../lib/utils'
import type { Cliente, EstadoComercialProyecto, PagoProyecto, Proyecto } from '../../types'
import { ProyectoFormModal } from './ProyectoFormModal'
import { ProyectoDetailPanel } from './ProyectoDetailPanel'

export function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pagosPorProyecto, setPagosPorProyecto] = useState<Record<string, PagoProyecto[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Proyecto | null>(null)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstadoComercial, setFiltroEstadoComercial] = useState<EstadoComercialProyecto | ''>('')
  const [busqueda, setBusqueda] = useState('')

  async function reload() {
    setLoading(true)
    const [p, c] = await Promise.all([listarProyectos(), listarClientes()])
    setProyectos(p)
    setClientes(c)
    const pagosEntries = await Promise.all(p.map(async (proyecto) => [proyecto.id, await listarPagosPorProyecto(proyecto.id)] as const))
    setPagosPorProyecto(Object.fromEntries(pagosEntries))
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const filtrados = useMemo(() => {
    return proyectos
      .filter((p) => !filtroCliente || p.clienteId === filtroCliente)
      .filter((p) => !filtroEstadoComercial || p.estadoComercial === filtroEstadoComercial)
      .filter((p) => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => compareDateStr(a.fechaEventoInicio ?? '9999', b.fechaEventoInicio ?? '9999'))
  }, [proyectos, filtroCliente, filtroEstadoComercial, busqueda])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Proyectos</h1>
          <p className="text-sm text-[var(--text-muted)]">Eventos, armados y balance comercial</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nuevo proyecto</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-[200px]" />
        <Select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} className="max-w-[200px]">
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select
          value={filtroEstadoComercial}
          onChange={(e) => setFiltroEstadoComercial(e.target.value as EstadoComercialProyecto | '')}
          className="max-w-[200px]"
        >
          <option value="">Todos los estados</option>
          <option value="negociacion">Negociación</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No hay proyectos que coincidan con el filtro.</Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((p) => {
            const cliente = clientes.find((c) => c.id === p.clienteId)
            const pagos = pagosPorProyecto[p.id] ?? []
            const balance = calcularBalanceProyecto(p, pagos)
            const estado = estadoPago(balance.presupuesto, balance.cobrado)
            const cronologico = estadoCronologico(p)
            return (
              <Card
                key={p.id}
                className="p-4 cursor-pointer hover:border-[var(--brand-500)] transition-colors"
                onClick={() => setSelected(p)}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.nombre}</p>
                    <p className="text-sm text-[var(--text-muted)] truncate">
                      {cliente?.nombre ?? '—'} · {p.ubicacion}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatDate(p.fechaEventoInicio)}
                      {p.fechaEventoFin ? ` – ${formatDate(p.fechaEventoFin)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex gap-1.5">
                      <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
                      <Badge color={ESTADO_PAGO_COLOR[estado]}>{ESTADO_PAGO_LABEL[estado]}</Badge>
                    </div>
                    <p className="text-sm">
                      <span className="text-[var(--text-muted)]">Pendiente: </span>
                      <span className="font-medium" style={{ color: balance.pendiente > 0 ? 'var(--debt)' : 'var(--paid)' }}>
                        {formatCurrency(balance.pendiente)}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ProyectoFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} />
      {selected && <ProyectoDetailPanel proyecto={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  )
}
