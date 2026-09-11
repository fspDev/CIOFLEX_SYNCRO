import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { listarJornadasPorEmpleado, listarPagosPorEmpleado } from '../../lib/repo'
import { calcularBalanceEmpleado } from '../../lib/balance'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Jornada, PagoEmpleado } from '../../types'
import { JornadaFormModal } from '../empleados/JornadaFormModal'

export function MisHorasPage() {
  const profile = useAuthStore((s) => s.profile)
  const empleadoId = profile?.empleadoId
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [pagos, setPagos] = useState<PagoEmpleado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    if (!empleadoId) return
    setLoading(true)
    const [j, p] = await Promise.all([listarJornadasPorEmpleado(empleadoId), listarPagosPorEmpleado(empleadoId)])
    setJornadas(j)
    setPagos(p)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoId])

  if (!empleadoId) {
    return <p className="text-sm text-[var(--text-muted)]">Tu usuario no tiene un empleado asociado. Contactá al administrador.</p>
  }

  const balance = calcularBalanceEmpleado(jornadas, pagos)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Mis horas</h1>
          <p className="text-sm text-[var(--text-muted)]">Cargá tus jornadas trabajadas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Cargar jornada</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Generado</p>
          <p className="text-xl font-semibold">{formatCurrency(balance.totalGenerado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Pagado</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--paid)' }}>
            {formatCurrency(balance.totalPagado)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Adeudado</p>
          <p className="text-xl font-semibold" style={{ color: balance.saldoAdeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
            {formatCurrency(balance.saldoAdeudado)}
          </p>
        </Card>
      </div>

      <h2 className="font-medium text-sm mb-3">Historial de jornadas</h2>
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
      ) : jornadas.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Todavía no cargaste ninguna jornada.</Card>
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
              <p className="text-sm font-medium shrink-0">{formatCurrency(j.montoTotal)}</p>
            </Card>
          ))}
        </div>
      )}

      <JornadaFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} empleadoId={empleadoId} />
    </div>
  )
}
