import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { confirmarAsistencia } from '../../lib/repo'
import { formatDate, hoursBetween } from '../../lib/utils'
import type { AsignacionDia, Proyecto } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  proyecto: Proyecto
  asignacion: AsignacionDia | null
  nombreEmpleado: string
}

// Al confirmar la asistencia se carga el horario realmente trabajado (pre-cargado con el
// planificado, pero editable) y con eso se genera la jornada del empleado.
export function ConfirmarAsistenciaModal({ open, onClose, onSaved, proyecto, asignacion, nombreEmpleado }: Props) {
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !asignacion) return
    setHoraInicio(asignacion.horaInicio ?? '')
    setHoraFin(asignacion.horaFin ?? '')
    setDescripcion(proyecto.nombre)
    setError(null)
  }, [open, asignacion, proyecto.nombre])

  const horas = useMemo(() => (horaInicio && horaFin ? hoursBetween(horaInicio, horaFin) : 0), [horaInicio, horaFin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!asignacion) return
    setError(null)
    setSaving(true)
    try {
      await confirmarAsistencia(proyecto, asignacion.fecha, asignacion.empleadoId, { horaInicio, horaFin, descripcion })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar la asistencia.')
    } finally {
      setSaving(false)
    }
  }

  if (!asignacion) return null

  return (
    <Modal open={open} onClose={onClose} title="Confirmar asistencia" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          {nombreEmpleado} · {formatDate(asignacion.fecha)}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde">
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </Field>
          <Field label="Hasta">
            <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
          </Field>
        </div>

        <p className="text-xs text-[var(--text-muted)]">Total: {horas} hs — se carga como jornada en el legajo del empleado.</p>

        <Field label="Descripción">
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Confirmar y cargar jornada'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
