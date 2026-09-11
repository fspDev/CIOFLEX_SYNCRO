import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown'
import { copiarAlPortapapeles, formatCurrency, initials, nombreCompleto, textoAccesoEmpleado } from '../../lib/utils'
import { listarEmpleados, listarJornadasPorEmpleado, listarPagosPorEmpleado } from '../../lib/repo'
import { calcularBalanceEmpleado, type BalanceEmpleado } from '../../lib/balance'
import type { Empleado } from '../../types'
import { EmpleadoFormModal } from './EmpleadoFormModal'
import { EmpleadoDetailPanel } from './EmpleadoDetailPanel'
import { GenerarAccesoModal } from './GenerarAccesoModal'

type FiltroEstado = 'todos' | 'activos' | 'inactivos'
type FiltroDeuda = 'todos' | 'con_deuda' | 'sin_deuda'

export function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [balances, setBalances] = useState<Record<string, BalanceEmpleado>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Empleado | null>(null)
  const [accesoTarget, setAccesoTarget] = useState<Empleado | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; texto: string } | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroDeuda, setFiltroDeuda] = useState<FiltroDeuda>('todos')

  async function reload() {
    setLoading(true)
    const lista = await listarEmpleados()
    setEmpleados(lista)
    // El panel de detalle recibe `selected` como prop -- si no se refresca acá, queda mostrando
    // datos viejos (ej. "Sin acceso todavía" después de generarlo) hasta cerrar y reabrir.
    setSelected((prev) => (prev ? (lista.find((e) => e.id === prev.id) ?? null) : null))
    const entries = await Promise.all(
      lista.map(async (e) => {
        const [jornadas, pagos] = await Promise.all([listarJornadasPorEmpleado(e.id), listarPagosPorEmpleado(e.id)])
        return [e.id, calcularBalanceEmpleado(jornadas, pagos)] as const
      }),
    )
    setBalances(Object.fromEntries(entries))
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const filtrados = useMemo(() => {
    return empleados
      .filter((e) => !busqueda || nombreCompleto(e.nombre, e.apellido).toLowerCase().includes(busqueda.toLowerCase()))
      .filter((e) => filtroEstado === 'todos' || (filtroEstado === 'activos' ? e.activo : !e.activo))
      .filter((e) => {
        if (filtroDeuda === 'todos') return true
        const saldo = balances[e.id]?.saldoAdeudado ?? 0
        return filtroDeuda === 'con_deuda' ? saldo > 0 : saldo <= 0
      })
  }, [empleados, busqueda, filtroEstado, filtroDeuda, balances])

  const totales = useMemo(() => {
    return filtrados.reduce(
      (acc, e) => {
        const b = balances[e.id]
        if (!b) return acc
        return {
          generado: acc.generado + b.totalGenerado,
          pagado: acc.pagado + b.totalPagado,
          adeudado: acc.adeudado + b.saldoAdeudado,
        }
      },
      { generado: 0, pagado: 0, adeudado: 0 },
    )
  }, [filtrados, balances])

  async function handleCopiarAcceso(e: Empleado) {
    if (!e.usuario || !e.passwordActual) return
    const ok = await copiarAlPortapapeles(textoAccesoEmpleado(e.usuario, e.passwordActual))
    setFeedback({ id: e.id, texto: ok ? 'Copiado ✓' : 'No se pudo copiar' })
    setTimeout(() => setFeedback(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Empleados</h1>
          <p className="text-sm text-[var(--text-muted)]">Alta, edición y seguimiento de horas y pagos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nuevo empleado</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total general (generado)</p>
          <p className="text-xl font-semibold">{loading ? '…' : formatCurrency(totales.generado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total pagado</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(totales.pagado)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total adeudado</p>
          <p className="text-xl font-semibold" style={{ color: totales.adeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(totales.adeudado)}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input placeholder="Buscar empleado…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-[200px]" />
        <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)} className="max-w-[160px]">
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </Select>
        <Select value={filtroDeuda} onChange={(e) => setFiltroDeuda(e.target.value as FiltroDeuda)} className="max-w-[180px]">
          <option value="todos">Con o sin deuda</option>
          <option value="con_deuda">Con deuda pendiente</option>
          <option value="sin_deuda">Sin deuda</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No hay empleados que coincidan con el filtro.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((e) => {
            const saldo = balances[e.id]?.saldoAdeudado ?? 0
            return (
              <Card
                key={e.id}
                className="p-4 cursor-pointer hover:border-[var(--brand-500)] transition-colors"
                onClick={() => setSelected(e)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[var(--brand-500)]/20 text-[var(--brand-400)] flex items-center justify-center font-semibold shrink-0">
                    {initials(e.nombre, e.apellido)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{nombreCompleto(e.nombre, e.apellido)}</p>
                    <p className="text-sm text-[var(--text-muted)] truncate">{e.telefono || 'Sin teléfono'}</p>
                  </div>
                  {!e.activo && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] shrink-0">
                      Inactivo
                    </span>
                  )}
                  <div className="ml-auto shrink-0" onClick={(ev) => ev.stopPropagation()}>
                    <Dropdown trigger={<span className="text-lg leading-none">⋮</span>}>
                      {(close) => (
                        <>
                          {e.authUid ? (
                            <>
                              {e.passwordActual ? (
                                <DropdownItem
                                  onClick={() => {
                                    close()
                                    handleCopiarAcceso(e)
                                  }}
                                >
                                  Copiar usuario y contraseña
                                </DropdownItem>
                              ) : (
                                <p className="px-3.5 py-1.5 text-xs text-[var(--text-muted)]">
                                  Sin contraseña guardada — reseteá el acceso para poder copiarlo.
                                </p>
                              )}
                              <DropdownItem
                                onClick={() => {
                                  close()
                                  setAccesoTarget(e)
                                }}
                              >
                                Resetear acceso
                              </DropdownItem>
                            </>
                          ) : (
                            <DropdownItem
                              onClick={() => {
                                close()
                                setAccesoTarget(e)
                              }}
                            >
                              Generar acceso
                            </DropdownItem>
                          )}
                        </>
                      )}
                    </Dropdown>
                  </div>
                </div>
                {feedback?.id === e.id && <p className="text-xs text-right mt-1" style={{ color: 'var(--paid)' }}>{feedback.texto}</p>}
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Adeudado</span>
                  <span className="font-medium" style={{ color: saldo > 0 ? 'var(--debt)' : 'var(--paid)' }}>
                    {formatCurrency(saldo)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <EmpleadoFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} />
      {selected && (
        <EmpleadoDetailPanel
          empleado={selected}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      )}
      {accesoTarget && (
        <GenerarAccesoModal
          open
          onClose={() => setAccesoTarget(null)}
          onSaved={reload}
          empleado={accesoTarget}
        />
      )}
    </div>
  )
}
