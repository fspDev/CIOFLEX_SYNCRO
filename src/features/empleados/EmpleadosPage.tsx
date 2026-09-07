import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { initials, nombreCompleto } from '../../lib/utils'
import { listarEmpleados } from '../../lib/repo'
import type { Empleado } from '../../types'
import { EmpleadoFormModal } from './EmpleadoFormModal'
import { EmpleadoDetailPanel } from './EmpleadoDetailPanel'

export function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Empleado | null>(null)

  async function reload() {
    setLoading(true)
    setEmpleados(await listarEmpleados())
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Empleados</h1>
          <p className="text-sm text-[var(--text-muted)]">Alta, edición y seguimiento de horas y pagos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nuevo empleado</Button>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : empleados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Todavía no hay empleados cargados.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleados.map((e) => (
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
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                    Inactivo
                  </span>
                )}
              </div>
            </Card>
          ))}
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
    </div>
  )
}
