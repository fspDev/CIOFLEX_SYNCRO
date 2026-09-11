import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { listarClientes, listarProyectosPorEmpleado } from '../../lib/repo'
import {
  estadoCronologico,
  ESTADO_CRONOLOGICO_COLOR,
  ESTADO_CRONOLOGICO_LABEL,
  TIPO_SERVICIO_COLOR,
  TIPO_SERVICIO_LABEL,
} from '../../lib/proyectoEstado'
import { formatDate } from '../../lib/utils'
import type { Cliente, Proyecto } from '../../types'

// Vista de solo lectura para el empleado: sin presupuesto ni datos de facturación/pagos
// (información comercial que no le corresponde ver), solo lo necesario para ubicarse en el trabajo.
export function MisProyectosPage() {
  const profile = useAuthStore((s) => s.profile)
  const empleadoId = profile?.empleadoId
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empleadoId) return
    setLoading(true)
    Promise.all([listarProyectosPorEmpleado(empleadoId), listarClientes()]).then(([p, c]) => {
      setProyectos(p)
      setClientes(c)
      setLoading(false)
    })
  }, [empleadoId])

  if (!empleadoId) {
    return <p className="text-sm text-[var(--text-muted)]">Tu usuario no tiene un empleado asociado. Contactá al administrador.</p>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Mis proyectos · {profile?.nombre}</h1>
        <p className="text-sm text-[var(--text-muted)]">Proyectos en los que estás asignado</p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
      ) : proyectos.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Todavía no estás asignado a ningún proyecto.</Card>
      ) : (
        <div className="space-y-3">
          {proyectos.map((p) => {
            const cliente = clientes.find((c) => c.id === p.clienteId)
            const cronologico = estadoCronologico(p)
            const miAsignacion = p.empleadosAsignados.find((a) => a.empleadoId === empleadoId)
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.nombre}</p>
                    <p className="text-sm text-[var(--text-muted)] truncate">
                      {cliente?.nombre ?? '—'} · {p.ubicacion}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge color={TIPO_SERVICIO_COLOR[p.tipoServicio]}>{TIPO_SERVICIO_LABEL[p.tipoServicio]}</Badge>
                    <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Armado</p>
                    <p>{formatDate(p.fechaArmadoInicio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Evento</p>
                    <p>
                      {formatDate(p.fechaEventoInicio)}
                      {p.fechaEventoFin ? ` – ${formatDate(p.fechaEventoFin)}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Desarme</p>
                    <p>{formatDate(p.fechaDesarmeInicio)}</p>
                  </div>
                </div>

                {miAsignacion?.horaInicio && miAsignacion?.horaFin && (
                  <p className="mt-2 text-sm">
                    <span className="text-[var(--text-muted)]">Tu horario: </span>
                    <span className="font-medium">
                      {miAsignacion.horaInicio}–{miAsignacion.horaFin}
                    </span>
                  </p>
                )}

                {p.notas && <p className="mt-2 text-sm text-[var(--text-muted)]">{p.notas}</p>}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
