import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import { listarJornadasPorEmpleado, listarPagosPorEmpleado } from '../../lib/repo'
import { calcularBalanceEmpleado } from '../../lib/balance'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Jornada, PagoEmpleado } from '../../types'

export function MisPagosPage() {
  const profile = useAuthStore((s) => s.profile)
  const empleadoId = profile?.empleadoId
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [pagos, setPagos] = useState<PagoEmpleado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empleadoId) return
    Promise.all([listarJornadasPorEmpleado(empleadoId), listarPagosPorEmpleado(empleadoId)]).then(([j, p]) => {
      setJornadas(j)
      setPagos(p)
      setLoading(false)
    })
  }, [empleadoId])

  if (!empleadoId) {
    return <p className="text-sm text-[var(--text-muted)]">Tu usuario no tiene un empleado asociado. Contactá al administrador.</p>
  }

  const balance = calcularBalanceEmpleado(jornadas, pagos)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Mis pagos</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Historial de pagos recibidos y saldo adeudado</p>

      <Card className="p-5 mb-6">
        <p className="text-xs text-[var(--text-muted)] mb-1">Saldo adeudado</p>
        <p className="text-3xl font-semibold" style={{ color: balance.saldoAdeudado > 0 ? 'var(--debt)' : 'var(--paid)' }}>
          {formatCurrency(balance.saldoAdeudado)}
        </p>
      </Card>

      <h2 className="font-medium text-sm mb-3">Historial de pagos</h2>
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
      ) : pagos.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Todavía no recibiste pagos registrados.</Card>
      ) : (
        <div className="space-y-2">
          {pagos.map((p) => (
            <Card key={p.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{formatDate(p.fecha)}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{p.formaPago}</p>
                {p.nota && <p className="text-xs text-[var(--text-muted)]">{p.nota}</p>}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--paid)' }}>
                {formatCurrency(p.monto)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
