import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { actualizarProyecto, crearProyecto, listarClientes, listarEmpleados } from '../../lib/repo'
import { nombreCompleto, todayStr } from '../../lib/utils'
import { TIPO_SERVICIO_LABEL } from '../../lib/proyectoEstado'
import type { Cliente, Empleado, EmpleadoAsignado, EstadoComercialProyecto, Proyecto, TipoServicioProyecto } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  proyecto?: Proyecto
}

export function ProyectoFormModal({ open, onClose, onSaved, proyecto }: Props) {
  const [nombre, setNombre] = useState(proyecto?.nombre ?? '')
  const [ubicacion, setUbicacion] = useState(proyecto?.ubicacion ?? '')
  const [clienteId, setClienteId] = useState(proyecto?.clienteId ?? '')
  const [tipoServicio, setTipoServicio] = useState<TipoServicioProyecto>(proyecto?.tipoServicio ?? 'armado')
  const [estadoComercial, setEstadoComercial] = useState<EstadoComercialProyecto>(proyecto?.estadoComercial ?? 'negociacion')
  const [fechaArmadoInicio, setFechaArmadoInicio] = useState(proyecto?.fechaArmadoInicio ?? '')
  const [fechaEventoInicio, setFechaEventoInicio] = useState(proyecto?.fechaEventoInicio ?? todayStr())
  const [fechaEventoFin, setFechaEventoFin] = useState(proyecto?.fechaEventoFin ?? '')
  const [fechaDesarmeInicio, setFechaDesarmeInicio] = useState(proyecto?.fechaDesarmeInicio ?? '')
  const [fechaDesarmeFin, setFechaDesarmeFin] = useState(proyecto?.fechaDesarmeFin ?? '')
  const [presupuesto, setPresupuesto] = useState(proyecto?.presupuesto ?? 0)
  const [notas, setNotas] = useState(proyecto?.notas ?? '')
  const [asignados, setAsignados] = useState<EmpleadoAsignado[]>(proyecto?.empleadosAsignados ?? [])

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      listarClientes().then(setClientes)
      listarEmpleados().then(setEmpleados)
    }
  }, [open])

  function toggleEmpleado(empleadoId: string) {
    setAsignados((prev) =>
      prev.some((a) => a.empleadoId === empleadoId)
        ? prev.filter((a) => a.empleadoId !== empleadoId)
        : [...prev, { empleadoId, horaInicio: '', horaFin: '' }],
    )
  }

  function setHorario(empleadoId: string, field: 'horaInicio' | 'horaFin', value: string) {
    setAsignados((prev) => prev.map((a) => (a.empleadoId === empleadoId ? { ...a, [field]: value } : a)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      nombre,
      ubicacion,
      clienteId,
      tipoServicio,
      estadoComercial,
      fechaArmadoInicio: fechaArmadoInicio || undefined,
      fechaEventoInicio: fechaEventoInicio || undefined,
      fechaEventoFin: fechaEventoFin || undefined,
      fechaDesarmeInicio: fechaDesarmeInicio || undefined,
      fechaDesarmeFin: fechaDesarmeFin || undefined,
      presupuesto,
      notas: notas || undefined,
      empleadosAsignados: asignados,
    }
    try {
      if (proyecto) {
        await actualizarProyecto(proyecto.id, data)
      } else {
        await crearProyecto(data)
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={proyecto ? 'Editar proyecto' : 'Nuevo proyecto'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre del proyecto">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </Field>
          <Field label="Ubicación">
            <Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente">
            <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Seleccionar…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de servicio">
            <Select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value as TipoServicioProyecto)}>
              {(Object.entries(TIPO_SERVICIO_LABEL) as [TipoServicioProyecto, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Estado comercial">
          <Select value={estadoComercial} onChange={(e) => setEstadoComercial(e.target.value as EstadoComercialProyecto)}>
            <option value="negociacion">Negociación</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </Field>

        <p className="text-xs font-medium text-[var(--text-muted)] pt-1">Fechas</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Armado (inicio)">
            <Input type="date" value={fechaArmadoInicio} onChange={(e) => setFechaArmadoInicio(e.target.value)} />
          </Field>
          <div />
          <Field label="Evento (inicio)">
            <Input type="date" value={fechaEventoInicio} onChange={(e) => setFechaEventoInicio(e.target.value)} required />
          </Field>
          <Field label="Evento (fin)">
            <Input type="date" value={fechaEventoFin} onChange={(e) => setFechaEventoFin(e.target.value)} />
          </Field>
          <Field label="Desarme (inicio)">
            <Input type="date" value={fechaDesarmeInicio} onChange={(e) => setFechaDesarmeInicio(e.target.value)} />
          </Field>
          <Field label="Desarme (fin)">
            <Input type="date" value={fechaDesarmeFin} onChange={(e) => setFechaDesarmeFin(e.target.value)} />
          </Field>
        </div>

        <Field label="Presupuesto">
          <MontoInput value={presupuesto} onChange={setPresupuesto} />
        </Field>

        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Empleados asignados</p>
          <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-56 overflow-y-auto">
            {empleados.map((emp) => {
              const asignado = asignados.find((a) => a.empleadoId === emp.id)
              return (
                <div key={emp.id} className="p-2.5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!asignado}
                    onChange={() => toggleEmpleado(emp.id)}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="text-sm flex-1 min-w-0 truncate">{nombreCompleto(emp.nombre, emp.apellido)}</span>
                  {asignado && (
                    <div className="flex gap-1 shrink-0">
                      <input
                        type="time"
                        value={asignado.horaInicio ?? ''}
                        onChange={(e) => setHorario(emp.id, 'horaInicio', e.target.value)}
                        className="px-1.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs w-24"
                      />
                      <input
                        type="time"
                        value={asignado.horaFin ?? ''}
                        onChange={(e) => setHorario(emp.id, 'horaFin', e.target.value)}
                        className="px-1.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs w-24"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Field label="Notas">
          <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
