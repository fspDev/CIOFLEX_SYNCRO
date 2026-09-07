import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import {
  listarClientes,
  listarEmpleados,
  listarJornadasPorEmpleado,
  listarMovimientos,
  listarPagosPorEmpleado,
  listarPagosPorProyecto,
  listarProyectos,
} from '../../lib/repo'
import { calcularBalanceEmpleado, calcularBalanceProyecto } from '../../lib/balance'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
import { compareDateStr, formatCurrency, formatDate, todayStr } from '../../lib/utils'
import type { Proyecto } from '../../types'

interface ResumenEmpleados {
  generado: number
  pagado: number
  adeudado: number
}

interface ResumenProyectos {
  presupuestado: number
  cobrado: number
  pendiente: number
}

interface ResumenMovimientos {
  ingresos: number
  egresos: number
  neto: number
}

export function DashboardPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [empleadosCount, setEmpleadosCount] = useState(0)
  const [clientesCount, setClientesCount] = useState(0)
  const [resumenEmpleados, setResumenEmpleados] = useState<ResumenEmpleados>({ generado: 0, pagado: 0, adeudado: 0 })
  const [resumenProyectos, setResumenProyectos] = useState<ResumenProyectos>({ presupuestado: 0, cobrado: 0, pendiente: 0 })
  const [resumenMovimientos, setResumenMovimientos] = useState<ResumenMovimientos>({ ingresos: 0, egresos: 0, neto: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [p, e, c, movimientos] = await Promise.all([
        listarProyectos(),
        listarEmpleados(),
        listarClientes(),
        listarMovimientos(),
      ])
      setProyectos(p)
      setEmpleadosCount(e.filter((emp) => emp.activo).length)
      setClientesCount(c.length)

      const balancesEmpleados = await Promise.all(
        e.map(async (emp) => {
          const [jornadas, pagos] = await Promise.all([listarJornadasPorEmpleado(emp.id), listarPagosPorEmpleado(emp.id)])
          return calcularBalanceEmpleado(jornadas, pagos)
        }),
      )
      setResumenEmpleados({
        generado: balancesEmpleados.reduce((a, b) => a + b.totalGenerado, 0),
        pagado: balancesEmpleados.reduce((a, b) => a + b.totalPagado, 0),
        adeudado: balancesEmpleados.reduce((a, b) => a + b.saldoAdeudado, 0),
      })

      const balancesProyectos = await Promise.all(
        p.map(async (proyecto) => calcularBalanceProyecto(proyecto, await listarPagosPorProyecto(proyecto.id))),
      )
      setResumenProyectos({
        presupuestado: balancesProyectos.reduce((a, b) => a + b.presupuesto, 0),
        cobrado: balancesProyectos.reduce((a, b) => a + b.cobrado, 0),
        pendiente: balancesProyectos.reduce((a, b) => a + b.pendiente, 0),
      })

      const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
      const egresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
      setResumenMovimientos({ ingresos, egresos, neto: ingresos - egresos })

      setLoading(false)
    }
    load()
  }, [])

  const hoy = todayStr()
  const proximos = [...proyectos]
    .filter((p) => (p.fechaEventoInicio ?? '') >= hoy)
    .sort((a, b) => compareDateStr(a.fechaEventoInicio ?? '', b.fechaEventoInicio ?? ''))
    .slice(0, 5)

  // Balance general de la empresa: lo que efectivamente entró vs. lo que efectivamente salió.
  const ingresosTotales = resumenProyectos.cobrado + resumenMovimientos.ingresos
  const egresosTotales = resumenEmpleados.pagado + resumenMovimientos.egresos
  const balanceGeneral = ingresosTotales - egresosTotales

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Balance general de la operación</p>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Balance general (cobrado + ingresos − pagado a empleados − egresos)</p>
            <p className="text-3xl font-semibold" style={{ color: balanceGeneral >= 0 ? 'var(--paid)' : 'var(--debt)' }}>
              {loading ? '…' : formatCurrency(balanceGeneral)}
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-[var(--text-muted)]">Ingresó</p>
              <p className="font-medium" style={{ color: 'var(--paid)' }}>
                {formatCurrency(ingresosTotales)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Salió</p>
              <p className="font-medium" style={{ color: 'var(--debt)' }}>
                {formatCurrency(egresosTotales)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Proyectos activos</p>
          <p className="text-2xl font-semibold">{proyectos.filter((p) => p.estadoComercial !== 'cancelado').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Empleados activos</p>
          <p className="text-2xl font-semibold">{empleadosCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Clientes</p>
          <p className="text-2xl font-semibold">{clientesCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Deuda con empleados</p>
          <p className="text-2xl font-semibold" style={{ color: resumenEmpleados.adeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(resumenEmpleados.adeudado)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <h2 className="font-medium mb-4">Empleados</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Generado</span>
              <span className="font-medium">{formatCurrency(resumenEmpleados.generado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Pagado</span>
              <span className="font-medium" style={{ color: 'var(--paid)' }}>
                {formatCurrency(resumenEmpleados.pagado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Adeudado</span>
              <span className="font-medium" style={{ color: resumenEmpleados.adeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
                {formatCurrency(resumenEmpleados.adeudado)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-medium mb-4">Proyectos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Presupuestado</span>
              <span className="font-medium">{formatCurrency(resumenProyectos.presupuestado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Cobrado</span>
              <span className="font-medium" style={{ color: 'var(--paid)' }}>
                {formatCurrency(resumenProyectos.cobrado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Pendiente</span>
              <span className="font-medium" style={{ color: resumenProyectos.pendiente > 0 ? 'var(--debt)' : 'var(--paid)' }}>
                {formatCurrency(resumenProyectos.pendiente)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">El detalle por proyecto está en la pestaña Proyectos.</p>
        </Card>

        <Card className="p-5">
          <h2 className="font-medium mb-4">Movimientos de caja</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Ingresos</span>
              <span className="font-medium" style={{ color: 'var(--paid)' }}>
                {formatCurrency(resumenMovimientos.ingresos)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Egresos</span>
              <span className="font-medium" style={{ color: 'var(--debt)' }}>
                {formatCurrency(resumenMovimientos.egresos)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Neto</span>
              <span className="font-medium" style={{ color: resumenMovimientos.neto >= 0 ? 'var(--paid)' : 'var(--debt)' }}>
                {formatCurrency(resumenMovimientos.neto)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">Materiales, herramientas, trabajos extra — pestaña Movimientos.</p>
        </Card>
      </div>

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
    </div>
  )
}
