import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { functions } from '../../lib/firebase'
import { normalizarUsuario } from '../../lib/auth'
import { copiarAlPortapapeles, textoAccesoEmpleado } from '../../lib/utils'
import type { Empleado } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleado: Empleado
}

function usuarioSugerido(empleado: Empleado) {
  if (empleado.usuario) return empleado.usuario
  return normalizarUsuario(`${empleado.nombre}.${empleado.apellido}`)
}

export function GenerarAccesoModal({ open, onClose, onSaved, empleado }: Props) {
  const [usuario, setUsuario] = useState(usuarioSugerido(empleado))
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ usuario: string; password: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const usuarioNormalizado = normalizarUsuario(usuario)
      const passwordFinal = password.trim()
      const crearAccesoEmpleado = httpsCallable(functions, 'crearAccesoEmpleado')
      await crearAccesoEmpleado({ empleadoId: empleado.id, usuario: usuarioNormalizado, password: passwordFinal })
      setResultado({ usuario: usuarioNormalizado, password: passwordFinal })
      onSaved()
    } catch {
      setError('No se pudo generar el acceso. Verificá que las Cloud Functions estén deployadas.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setResultado(null)
    setCopiado(false)
    onClose()
  }

  async function handleCopiar() {
    if (!resultado) return
    const ok = await copiarAlPortapapeles(textoAccesoEmpleado(resultado.usuario, resultado.password))
    if (ok) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
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
              <span className="text-[var(--text-muted)]">Usuario: </span>
              {resultado.usuario}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Contraseña: </span>
              {resultado.password}
            </p>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleCopiar}>
            {copiado ? 'Copiado ✓' : 'Copiar'}
          </Button>
          <Button className="w-full" onClick={handleClose}>
            Listo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Usuario de acceso">
            <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} required minLength={3} />
          </Field>
          <p className="text-xs text-[var(--text-muted)] -mt-2">
            Sin espacios ni email — solo un nombre de usuario simple, ej. <code>juan.perez</code>.
          </p>
          <Field label="Contraseña temporal">
            <PasswordInput
              defaultVisible
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
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
