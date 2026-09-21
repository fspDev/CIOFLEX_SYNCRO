import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { iniciarJornada, listarProyectos } from '../../lib/repo'
import { nowTimeStr, todayStr } from '../../lib/utils'
import type { Proyecto } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleadoId: string
  validada: boolean // true si lo inicia un admin (queda validada de una), false si es el propio empleado
}

// Fecha y hora de inicio son editables porque la carga es diferida: se puede cargar el ingreso
// bastante después de que ocurrió (ej. cargar a las 11:50 un ingreso que fue a las 8:00, o al
// día siguiente). Por default se pre-cargan con el momento actual, pero no se fuerzan.
export function IniciarJornadaModal({ open, onClose, onSaved, empleadoId, validada }: Props) {
  const [fecha, setFecha] = useState(todayStr())
  const [horaInicio, setHoraInicio] = useState(nowTimeStr())
  const [descripcion, setDescripcion] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    listarProyectos().then(setProyectos)
    setFecha(todayStr())
    setHoraInicio(nowTimeStr())
    setDescripcion('')
    setProyectoId('')
    setError(null)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await iniciarJornada({ empleadoId, fecha, horaInicio, descripcion, proyectoId: proyectoId || undefined, validada })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la jornada.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Iniciar jornada" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-[var(--text-muted)]">
          Cargá el fin de la jornada más tarde, cuando termine de trabajar.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Field>
          <Field label="Hora de inicio">
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </Field>
        </div>

        <Field label="Proyecto (opcional)">
          <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
            <option value="">Trabajo suelto, sin proyecto</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descripción (opcional)">
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Iniciando…' : 'Iniciar jornada'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
