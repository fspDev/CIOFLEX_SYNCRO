import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { actualizarEmpleado, crearEmpleado } from '../../lib/repo'
import { functions } from '../../lib/firebase'
import { normalizarUsuario } from '../../lib/auth'
import { mensajeError } from '../../lib/utils'
import type { Empleado } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleado?: Empleado // presente = editar; ausente = alta nueva
}

/** Usuario sugerido al editar un empleado que todavía no tiene acceso generado. */
function usuarioSugerido(empleado: Empleado) {
  if (empleado.usuario) return empleado.usuario
  return normalizarUsuario(`${empleado.nombre}.${empleado.apellido}`)
}

export function EmpleadoFormModal({ open, onClose, onSaved, empleado }: Props) {
  const editando = !!empleado
  const tieneAcceso = !!empleado?.authUid

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
    setUsuario(empleado ? usuarioSugerido(empleado) : '')
    setPassword('')
    setError(null)
  }, [open, empleado])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (usuario.trim() && !password.trim() && !tieneAcceso) {
      setError('Ingresá una contraseña para el acceso, o dejá "Usuario" vacío para no darle acceso todavía.')
      return
    }

    const datos = {
      nombre,
      apellido,
      telefono,
      dniCuil: dniCuil.trim() || undefined,
      fechaNacimiento: fechaNacimiento || undefined,
      direccion: direccion.trim() || undefined,
    }

    setSaving(true)
    try {
      let empleadoId: string
      if (editando) {
        await actualizarEmpleado(empleado.id, datos)
        empleadoId = empleado.id
      } else {
        empleadoId = await crearEmpleado({ ...datos, activo: true })
        // Ya se creó el empleado -- limpiamos ahora para que un reintento tras un error de acceso
        // no vuelva a crear un segundo empleado con los mismos datos.
        setNombre('')
        setApellido('')
        setTelefono('')
        setDniCuil('')
        setFechaNacimiento('')
        setDireccion('')
      }
      onSaved()

      // En alta o si todavía no tenía acceso: solo se toca si se cargó un usuario. Si ya tenía
      // acceso: solo se vuelve a llamar a la función si el usuario o la contraseña cambiaron,
      // para no reescribir la cuenta de Auth en cada edición de datos que no toca el acceso.
      const usuarioCambio = tieneAcceso && normalizarUsuario(usuario) !== empleado?.usuario
      const debeActualizarAcceso = usuario.trim() && (!tieneAcceso || usuarioCambio || password.trim())
      if (debeActualizarAcceso) {
        try {
          const crearAccesoEmpleado = httpsCallable(functions, 'crearAccesoEmpleado')
          await crearAccesoEmpleado({
            empleadoId,
            usuario: normalizarUsuario(usuario),
            ...(password.trim() ? { password: password.trim() } : {}),
          })
        } catch (err) {
          const detalle = mensajeError(err, '')
          setError(
            `Se guardaron los datos, pero no se pudo ${tieneAcceso ? 'actualizar' : 'generar'} el acceso${detalle ? `: ${detalle}` : ''}.`,
          )
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

        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-3">
            {tieneAcceso ? 'Usuario y contraseña de acceso' : 'Acceso a la plataforma (opcional)'}
          </p>
          <div className="space-y-3">
            <Field label="Usuario de acceso">
              <Input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej. juan.perez"
                minLength={3}
              />
            </Field>
            <Field label={tieneAcceso ? 'Contraseña nueva (opcional)' : 'Contraseña'}>
              <PasswordInput defaultVisible value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            </Field>
            <p className="text-xs text-[var(--text-muted)]">
              {tieneAcceso
                ? 'Dejala vacía para mantener la contraseña actual.'
                : 'Dejá "Usuario" vacío si todavía no querés darle acceso.'}
            </p>
          </div>
        </div>

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
