import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import {
  listarClientes,
  listarEmpleados,
  listarJornadasPorEmpleado,
  listarPagosPorEmpleado,
  listarPagosPorProyecto,
  listarProyectos,
} from '../../lib/repo'
import { calcularBalanceEmpleado, calcularBalanceProyecto } from '../../lib/balance'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
import { compareDateStr, formatCurrency, formatDate, nombreCompleto, todayStr } from '../../lib/utils'
import type { Empleado, Proyecto } from '../../types'

export function DashboardPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [clientesCount, setClientesCount] = useState(0)
  const [deudaEmpleados, setDeudaEmpleados] = useState(0)
  const [pendienteProyectos, setPendienteProyectos] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [p, e, c] = await Promise.all([listarProyectos(), listarEmpleados(), listarClientes()])
      setProyectos(p)
      setEmpleados(e)
      setClientesCount(c.length)

      const deudas = await Promise.all(
        e.map(async (emp) => {
          const [jornadas, pagos] = await Promise.all([listarJornadasPorEmpleado(emp.id), listarPagosPorEmpleado(emp.id)])
          return calcularBalanceEmpleado(jornadas, pagos).saldoAdeudado
        }),
      )
      setDeudaEmpleados(deudas.reduce((a, b) => a + b, 0))

      const pendientes = await Promise.all(
        p.map(async (proyecto) => {
          const pagos = await listarPagosPorProyecto(proyecto.id)
          return calcularBalanceProyecto(proyecto, pagos).pendiente
        }),
      )
      setPendienteProyectos(pendientes.reduce((a, b) => a + b, 0))
      setLoading(false)
    }
    load()
  }, [])

  const hoy = todayStr()
  const proximos = [...proyectos]
    .filter((p) => (p.fechaEventoInicio ?? '') >= hoy)
    .sort((a, b) => compareDateStr(a.fechaEventoInicio ?? '', b.fechaEventoInicio ?? ''))
    .slice(0, 5)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Resumen general de la operación</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Proyectos activos</p>
          <p className="text-2xl font-semibold">{proyectos.filter((p) => p.estadoComercial !== 'cancelado').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Empleados</p>
          <p className="text-2xl font-semibold">{empleados.filter((e) => e.activo).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Clientes</p>
          <p className="text-2xl font-semibold">{clientesCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Deuda con empleados</p>
          <p className="text-2xl font-semibold" style={{ color: deudaEmpleados > 0 ? 'var(--debt)' : 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(deudaEmpleados)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-medium mb-4">Próximos eventos</h2>
          {proximos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No hay eventos próximos.</p>
          ) : (
            <div className="space-y-3">
              {proximos.map((p) => {
                const cronologico = estadoCronologico(p)
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(p.fechaEventoInicio)}</p>
                    </div>
                    <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-medium mb-4">Cobranza pendiente en proyectos</h2>
          <p className="text-2xl font-semibold" style={{ color: pendienteProyectos > 0 ? 'var(--debt)' : 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(pendienteProyectos)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Suma de saldos pendientes de todos los proyectos activos.</p>

          <h3 className="font-medium mt-6 mb-3 text-sm">Empleados</h3>
          <div className="space-y-2">
            {empleados.slice(0, 5).map((e) => (
              <p key={e.id} className="text-sm text-[var(--text-muted)]">
                {nombreCompleto(e.nombre, e.apellido)}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
