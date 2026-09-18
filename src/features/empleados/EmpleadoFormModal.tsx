import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { actualizarEmpleado, crearEmpleado } from '../../lib/repo'
import { functions } from '../../lib/firebase'
import { normalizarUsuario } from '../../lib/auth'
import type { Empleado } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleado?: Empleado // presente = editar; ausente = alta nueva
}

export function EmpleadoFormModal({ open, onClose, onSaved, empleado }: Props) {
  const editando = !!empleado

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dniCuil, setDniCuil] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [direccion, setDireccion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNombre(empleado?.nombre ?? '')
    setApellido(empleado?.apellido ?? '')
    setTelefono(empleado?.telefono ?? '')
    setDniCuil(empleado?.dniCuil ?? '')
    setFechaNacimiento(empleado?.fechaNacimiento ?? '')
    setDireccion(empleado?.direccion ?? '')
    setUsuario('')
    setPassword('')
    setError(null)
  }, [open, empleado])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const datos = {
      nombre,
      apellido,
      telefono,
      dniCuil: dniCuil.trim() || undefined,
      fechaNacimiento: fechaNacimiento || undefined,
      direccion: direccion.trim() || undefined,
    }

    if (editando) {
      setSaving(true)
      try {
        await actualizarEmpleado(empleado.id, datos)
        onSaved()
        onClose()
      } finally {
        setSaving(false)
      }
      return
    }

    if (usuario.trim() && !password.trim()) {
      setError('Ingresá una contraseña para el acceso, o dejá "Usuario" vacío para no darle acceso todavía.')
      return
    }
    setSaving(true)
    try {
      const empleadoId = await crearEmpleado({ ...datos, activo: true })
      // Ya se creó el empleado -- limpiamos ahora para que un reintento tras un error de acceso
      // no vuelva a crear un segundo empleado con los mismos datos.
      setNombre('')
      setApellido('')
      setTelefono('')
      setDniCuil('')
      setFechaNacimiento('')
      setDireccion('')
      onSaved()

      if (usuario.trim() && password.trim()) {
        try {
          const crearAccesoEmpleado = httpsCallable(functions, 'crearAccesoEmpleado')
          await crearAccesoEmpleado({ empleadoId, usuario: normalizarUsuario(usuario), password: password.trim() })
        } catch {
          setError('El empleado se creó, pero no se pudo generar su acceso. Podés generarlo después desde el menú de 3 puntos.')
          setSaving(false)
          return
        }
      }

      setUsuario('')
      setPassword('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editando ? 'Editar empleado' : 'Nuevo empleado'} size="sm">
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
        <Field label="DNI/CUIL">
          <Input value={dniCuil} onChange={(e) => setDniCuil(e.target.value)} placeholder="ej. 30.123.456" />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        </Field>
        <Field label="Dirección">
          <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </Field>

        {!editando && (
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Acceso a la plataforma (opcional)</p>
            <div className="space-y-3">
              <Field label="Usuario de acceso">
                <Input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ej. juan.perez"
                  minLength={3}
                />
              </Field>
              <Field label="Contraseña">
                <PasswordInput
                  defaultVisible
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </Field>
              <p className="text-xs text-[var(--text-muted)]">
                Dejá "Usuario" vacío si todavía no querés darle acceso — lo podés generar después desde el menú de 3 puntos.
              </p>
            </div>
          </div>
        )}

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
