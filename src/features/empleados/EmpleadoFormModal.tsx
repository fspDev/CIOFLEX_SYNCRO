import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { crearEmpleado } from '../../lib/repo'
import type { Empleado } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleado?: Empleado
}

export function EmpleadoFormModal({ open, onClose, onSaved, empleado }: Props) {
  const [nombre, setNombre] = useState(empleado?.nombre ?? '')
  const [apellido, setApellido] = useState(empleado?.apellido ?? '')
  const [telefono, setTelefono] = useState(empleado?.telefono ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await crearEmpleado({ nombre, apellido, telefono, activo: true })
      onSaved()
      onClose()
      setNombre('')
      setApellido('')
      setTelefono('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo empleado" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        </Field>
        <Field label="Apellido">
          <Input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </Field>
        <Field label="Teléfono">
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </Field>
        <p className="text-xs text-[var(--text-muted)]">
          Después de guardar, desde la ficha del empleado vas a poder generar su acceso (usuario y contraseña) para que pueda cargar sus horas.
        </p>
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
