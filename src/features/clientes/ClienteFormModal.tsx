import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { actualizarCliente, crearCliente } from '../../lib/repo'
import type { Cliente } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  cliente?: Cliente
}

export function ClienteFormModal({ open, onClose, onSaved, cliente }: Props) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (cliente) {
        await actualizarCliente(cliente.id, { nombre, telefono, email, notas })
      } else {
        await crearCliente({ nombre, telefono, email, notas })
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={cliente ? 'Editar cliente' : 'Nuevo cliente'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre / Razón social">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        </Field>
        <Field label="Teléfono">
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Notas">
          <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
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
