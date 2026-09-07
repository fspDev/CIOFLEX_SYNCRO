import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { functions } from '../../lib/firebase'
import type { Empleado } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleado: Empleado
}

function generarPassword() {
  return Math.random().toString(36).slice(-8)
}

export function GenerarAccesoModal({ open, onClose, onSaved, empleado }: Props) {
  const [email, setEmail] = useState(empleado.email ?? '')
  const [password, setPassword] = useState(generarPassword())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ email: string; password: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const crearAccesoEmpleado = httpsCallable(functions, 'crearAccesoEmpleado')
      await crearAccesoEmpleado({ empleadoId: empleado.id, email, password })
      setResultado({ email, password })
      onSaved()
    } catch {
      setError('No se pudo generar el acceso. Verificá que las Cloud Functions estén deployadas.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setResultado(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Generar acceso" size="sm">
      {resultado ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Compartile estos datos al empleado para que ingrese a la plataforma:
          </p>
          <div className="bg-[var(--surface-2)] rounded-lg p-3 text-sm space-y-1">
            <p>
              <span className="text-[var(--text-muted)]">Email: </span>
              {resultado.email}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Contraseña: </span>
              {resultado.password}
            </p>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Listo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email de acceso">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña temporal">
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <Button type="button" variant="secondary" onClick={() => setPassword(generarPassword())}>
                Generar
              </Button>
            </div>
          </Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Generando…' : 'Generar acceso'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
