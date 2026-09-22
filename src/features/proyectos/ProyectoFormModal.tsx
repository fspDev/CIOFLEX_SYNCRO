import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { actualizarProyecto, crearProyecto, listarClientes, listarEmpleados, obtenerTiposServicio } from '../../lib/repo'
import { diasDeFasesArmado, diasEnRango } from '../../lib/proyectoEstado'
import { formatDate, nombreCompleto, todayStr } from '../../lib/utils'
import type { AsignacionDia, Cliente, Empleado, EstadoComercialProyecto, Proyecto, TipoServicioConfig } from '../../types'

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
  const [estadoComercial, setEstadoComercial] = useState<EstadoComercialProyecto>(proyecto?.estadoComercial ?? 'negociacion')
  const [tipoServicio, setTipoServicio] = useState(proyecto?.tipoServicio ?? '')
  const [fechaArmadoInicio, setFechaArmadoInicio] = useState(proyecto?.fechaArmadoInicio ?? '')
  const [fechaArmadoFin, setFechaArmadoFin] = useState(proyecto?.fechaArmadoFin ?? proyecto?.fechaArmadoInicio ?? '')
  const [fechaEventoInicio, setFechaEventoInicio] = useState(proyecto?.fechaEventoInicio ?? todayStr())
  const [fechaEventoFin, setFechaEventoFin] = useState(proyecto?.fechaEventoFin ?? '')
  const [fechaDesarmeInicio, setFechaDesarmeInicio] = useState(proyecto?.fechaDesarmeInicio ?? '')
  const [fechaDesarmeFin, setFechaDesarmeFin] = useState(proyecto?.fechaDesarmeFin ?? '')
  const [diasTrabajo, setDiasTrabajo] = useState<string[]>(proyecto?.diasTrabajo ?? [])
  const [nuevoDia, setNuevoDia] = useState(todayStr())
  const [nuevoDiaHasta, setNuevoDiaHasta] = useState('')
  const [presupuesto, setPresupuesto] = useState(proyecto?.presupuesto ?? 0)
  const [notas, setNotas] = useState(proyecto?.notas ?? '')
  const [asignaciones, setAsignaciones] = useState<AsignacionDia[]>(proyecto?.asignaciones ?? [])

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [tiposServicio, setTiposServicio] = useState<TipoServicioConfig[]>([])
  const [saving, setSaving] = useState(false)

  // El modal queda montado aunque esté cerrado, así que los valores iniciales de useState solo
  // corren una vez. Sin re-sincronizar acá, al reabrirlo se ve (y se guarda) el estado viejo —
  // pisando cambios hechos mientras tanto, como las asistencias confirmadas o las notas.
  useEffect(() => {
    if (!open) return
    listarClientes().then(setClientes)
    listarEmpleados().then(setEmpleados)
    obtenerTiposServicio().then((tipos) => {
      setTiposServicio(tipos)
      if (!proyecto?.tipoServicio && tipos.length > 0) setTipoServicio(tipos[0].nombre)
    })

    setNombre(proyecto?.nombre ?? '')
    setUbicacion(proyecto?.ubicacion ?? '')
    setClienteId(proyecto?.clienteId ?? '')
    setEstadoComercial(proyecto?.estadoComercial ?? 'negociacion')
    setTipoServicio(proyecto?.tipoServicio ?? '')
    setFechaArmadoInicio(proyecto?.fechaArmadoInicio ?? '')
    setFechaArmadoFin(proyecto?.fechaArmadoFin ?? proyecto?.fechaArmadoInicio ?? '')
    setFechaEventoInicio(proyecto?.fechaEventoInicio ?? todayStr())
    setFechaEventoFin(proyecto?.fechaEventoFin ?? '')
    setFechaDesarmeInicio(proyecto?.fechaDesarmeInicio ?? '')
    setFechaDesarmeFin(proyecto?.fechaDesarmeFin ?? '')
    setDiasTrabajo(proyecto?.diasTrabajo ?? [])
    setPresupuesto(proyecto?.presupuesto ?? 0)
    setNotas(proyecto?.notas ?? '')
    setAsignaciones(proyecto?.asignaciones ?? [])
  }, [open, proyecto])

  const tipoSeleccionado = tiposServicio.find((t) => t.nombre === tipoServicio)
  const usaFasesArmado = tipoSeleccionado?.usaFasesArmado ?? true

  const diasDelTrabajo = useMemo(() => {
    if (usaFasesArmado) {
      return diasDeFasesArmado({ fechaArmadoInicio, fechaArmadoFin, fechaEventoInicio, fechaEventoFin, fechaDesarmeInicio, fechaDesarmeFin })
    }
    return [...diasTrabajo].sort()
  }, [usaFasesArmado, fechaArmadoInicio, fechaArmadoFin, fechaEventoInicio, fechaEventoFin, fechaDesarmeInicio, fechaDesarmeFin, diasTrabajo])

  // Acepta un día suelto o un rango (si se completa "hasta"), para no tener que cargar de a uno
  // los trabajos de varios días seguidos.
  function handleAgregarDia() {
    if (!nuevoDia) return
    const nuevos = diasEnRango(nuevoDia, nuevoDiaHasta || nuevoDia)
    setDiasTrabajo((prev) => [...new Set([...prev, ...nuevos])].sort())
    setNuevoDiaHasta('')
  }

  function handleQuitarDia(dia: string) {
    setDiasTrabajo((prev) => prev.filter((d) => d !== dia))
    setAsignaciones((prev) => prev.filter((a) => a.fecha !== dia))
  }

  function handleAgregarAsignacion(fecha: string, empleadoId: string, horaInicio: string, horaFin: string) {
    if (!empleadoId) return
    setAsignaciones((prev) => [...prev, { fecha, empleadoId, horaInicio: horaInicio || undefined, horaFin: horaFin || undefined }])
  }

  function handleQuitarAsignacion(index: number) {
    setAsignaciones((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      nombre,
      ubicacion,
      clienteId,
      estadoComercial,
      tipoServicio,
      fechaArmadoInicio: usaFasesArmado ? fechaArmadoInicio || undefined : undefined,
      // Si no se especifica fin de armado, por defecto es el mismo día que el inicio.
      fechaArmadoFin: usaFasesArmado ? (fechaArmadoFin || fechaArmadoInicio || undefined) : undefined,
      fechaEventoInicio: usaFasesArmado ? fechaEventoInicio || undefined : undefined,
      fechaEventoFin: usaFasesArmado ? fechaEventoFin || undefined : undefined,
      fechaDesarmeInicio: usaFasesArmado ? fechaDesarmeInicio || undefined : undefined,
      fechaDesarmeFin: usaFasesArmado ? fechaDesarmeFin || undefined : undefined,
      diasTrabajo: usaFasesArmado ? undefined : diasTrabajo,
      presupuesto,
      notas: notas || undefined,
      asignaciones: asignaciones.filter((a) => diasDelTrabajo.includes(a.fecha)),
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

        <div className="grid grid-cols-3 gap-3">
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
            <Select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} required>
              {tiposServicio.map((t) => (
                <option key={t.nombre} value={t.nombre}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado comercial">
            <Select value={estadoComercial} onChange={(e) => setEstadoComercial(e.target.value as EstadoComercialProyecto)}>
              <option value="negociacion">Negociación</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </Field>
        </div>

        {usaFasesArmado ? (
          <>
            <p className="text-xs font-medium text-[var(--text-muted)] pt-1">Fechas por fase</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Armado (inicio)">
                <Input type="date" value={fechaArmadoInicio} onChange={(e) => setFechaArmadoInicio(e.target.value)} />
              </Field>
              <Field label="Armado (fin)">
                <Input
                  type="date"
                  value={fechaArmadoFin}
                  min={fechaArmadoInicio || undefined}
                  onChange={(e) => setFechaArmadoFin(e.target.value)}
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Si se deja vacío, es el mismo día del inicio.</p>
              </Field>
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
          </>
        ) : (
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
              Días de trabajo (no necesariamente consecutivos)
            </p>
            <div className="flex gap-2 mb-1 items-end flex-wrap">
              <Field label="Desde">
                <Input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} />
              </Field>
              <Field label="Hasta (opcional)">
                <Input
                  type="date"
                  value={nuevoDiaHasta}
                  min={nuevoDia || undefined}
                  onChange={(e) => setNuevoDiaHasta(e.target.value)}
                />
              </Field>
              <Button type="button" variant="secondary" onClick={handleAgregarDia}>
                + Agregar
              </Button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              Dejá "hasta" vacío para agregar un solo día. Después podés asignar empleados a cada día.
            </p>
            {diasTrabajo.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Todavía no agregaste ningún día.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {diasTrabajo.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-sm">
                    {formatDate(d)}
                    <button type="button" onClick={() => handleQuitarDia(d)} className="text-[var(--text-muted)] hover:text-red-400">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <Field label="Presupuesto">
          <MontoInput value={presupuesto} onChange={setPresupuesto} />
        </Field>

        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Empleados asignados por día</p>
          {diasDelTrabajo.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Cargá {usaFasesArmado ? 'las fechas' : 'los días de trabajo'} para poder asignar empleados.
            </p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {diasDelTrabajo.map((dia) => (
                <DiaAsignacion
                  key={dia}
                  dia={dia}
                  empleados={empleados}
                  asignaciones={asignaciones}
                  onAgregar={(empleadoId, horaInicio, horaFin) => handleAgregarAsignacion(dia, empleadoId, horaInicio, horaFin)}
                  onQuitar={handleQuitarAsignacion}
                />
              ))}
            </div>
          )}
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

function DiaAsignacion({
  dia,
  empleados,
  asignaciones,
  onAgregar,
  onQuitar,
}: {
  dia: string
  empleados: Empleado[]
  asignaciones: AsignacionDia[]
  onAgregar: (empleadoId: string, horaInicio: string, horaFin: string) => void
  onQuitar: (indexGlobal: number) => void
}) {
  const [empleadoId, setEmpleadoId] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  const asignacionesDelDia = asignaciones.map((a, index) => ({ ...a, index })).filter((a) => a.fecha === dia)
  const empleadosDisponibles = empleados.filter((e) => !asignacionesDelDia.some((a) => a.empleadoId === e.id))

  function handleAgregar() {
    if (!empleadoId) return
    onAgregar(empleadoId, horaInicio, horaFin)
    setEmpleadoId('')
    setHoraInicio('')
    setHoraFin('')
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-3">
      <p className="text-sm font-medium mb-2">{formatDate(dia)}</p>
      {asignacionesDelDia.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {asignacionesDelDia.map((a) => {
            const emp = empleados.find((e) => e.id === a.empleadoId)
            return (
              <div key={a.index} className="flex items-center justify-between text-sm bg-[var(--surface-2)] rounded-lg px-2.5 py-1.5">
                <span className="truncate">{emp ? nombreCompleto(emp.nombre, emp.apellido) : 'Empleado eliminado'}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {a.horaInicio && a.horaFin && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {a.horaInicio}–{a.horaFin}
                    </span>
                  )}
                  <button type="button" onClick={() => onQuitar(a.index)} className="text-[var(--text-muted)] hover:text-red-400">
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {empleadosDisponibles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} className="flex-1 min-w-[140px] !py-1.5 text-xs">
            <option value="">+ Agregar empleado…</option>
            {empleadosDisponibles.map((e) => (
              <option key={e.id} value={e.id}>
                {nombreCompleto(e.nombre, e.apellido)}
              </option>
            ))}
          </Select>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-[var(--surface-2)] border-[1.5px] border-[var(--input-border)] text-xs w-24"
          />
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-[var(--surface-2)] border-[1.5px] border-[var(--input-border)] text-xs w-24"
          />
          <Button type="button" variant="secondary" onClick={handleAgregar} disabled={!empleadoId}>
            +
          </Button>
        </div>
      )}
    </div>
  )
}
