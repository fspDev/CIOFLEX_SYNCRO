import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { functions } from '../../lib/firebase'
import type { UserProfile } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  admin?: UserProfile
}

export function AdminFormModal({ open, onClose, onSaved, admin }: Props) {
  const [nombre, setNombre] = useState(admin?.nombre ?? '')
  const [email, setEmail] = useState(admin?.email ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const crearAccesoAdmin = httpsCallable(functions, 'crearAccesoAdmin')
      await crearAccesoAdmin({ uid: admin?.id, nombre, email, password: password || undefined })
      onSaved()
      onClose()
      setNombre('')
      setEmail('')
      setPassword('')
    } catch {
      setError('No se pudo guardar. Revisá los datos e intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={admin ? 'Editar administrador' : 'Nuevo administrador'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label={admin ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required={!admin} />
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
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
