import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { listarClientes, listarProyectosPorEmpleado } from '../../lib/repo'
import { estadoCronologico, ESTADO_CRONOLOGICO_COLOR, ESTADO_CRONOLOGICO_LABEL } from '../../lib/proyectoEstado'
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
            const misDias = (p.asignaciones ?? [])
              .filter((a) => a.empleadoId === empleadoId)
              .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
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
                    <Badge color="var(--brand-500)">{p.tipoServicio}</Badge>
                    <Badge color={ESTADO_CRONOLOGICO_COLOR[cronologico]}>{ESTADO_CRONOLOGICO_LABEL[cronologico]}</Badge>
                  </div>
                </div>

                {p.diasTrabajo && p.diasTrabajo.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Días de trabajo</p>
                    <p>{p.diasTrabajo.map((d) => formatDate(d)).join(', ')}</p>
                  </div>
                ) : (
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
                )}

                {misDias.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-[var(--text-muted)]">Tus días y horarios:</p>
                    {misDias.map((a, idx) => (
                      <p key={idx} className="text-sm">
                        <span className="font-medium">{formatDate(a.fecha)}</span>
                        {a.horaInicio && a.horaFin && <span className="text-[var(--text-muted)]"> · {a.horaInicio}–{a.horaFin}</span>}
                      </p>
                    ))}
                  </div>
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
