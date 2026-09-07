import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Rol } from '../../types'

interface Paso {
  titulo: string
  texto: string
}

const PASOS_ADMIN: Paso[] = [
  {
    titulo: '1. Cargá tus empleados',
    texto: 'Desde la pestaña "Empleados" tocá "+ Nuevo empleado" y cargá nombre, apellido y teléfono.',
  },
  {
    titulo: '2. Fijá el valor de la hora',
    texto: 'Entrá a la ficha del empleado y tocá "Actualizar" en "Valor de la hora". Sin esto, todavía no va a poder cargar jornadas — cada mes podés actualizarlo, y las jornadas viejas conservan el valor con el que se cargaron.',
  },
  {
    titulo: '3. Generá su acceso',
    texto: 'En la misma ficha, tocá "Generar acceso" y elegí un usuario simple y una contraseña. Compartíselos al empleado — con eso ya puede entrar solo a cargar sus horas.',
  },
  {
    titulo: '4. Cargá clientes y proyectos',
    texto: 'En "Clientes" cargá con quién trabajás, y en "Proyectos" armá cada evento con sus fechas, empleados asignados y presupuesto.',
  },
  {
    titulo: '5. Registrá cobros y pagos',
    texto: 'Desde la ficha de cada proyecto registrás lo que te van cobrando, y desde la ficha de cada empleado registrás lo que le vas pagando.',
  },
  {
    titulo: '6. Revisá el Dashboard',
    texto: 'Ahí vas a ver el balance general: cuánto generaron y adeudan los empleados, el estado de los proyectos, y el flujo de caja de la pestaña "Movimientos".',
  },
]

const PASOS_EMPLEADO: Paso[] = [
  {
    titulo: '1. Cargá tu jornada',
    texto: 'En "Mis horas" tocá "+ Cargar jornada". Elegí si cargás la cantidad de horas o un rango horario, agregá una descripción y guardá.',
  },
  {
    titulo: '2. Mirá cuánto te corresponde',
    texto: 'Cada jornada muestra el monto calculado con el valor de la hora vigente ese mes.',
  },
  {
    titulo: '3. Consultá tus pagos',
    texto: 'En "Mis pagos" vas a ver el historial de lo que te pagaron y cuánto se te adeuda todavía. Los pagos los carga únicamente tu administrador.',
  },
]

interface Props {
  open: boolean
  onClose: () => void
  rol: Rol
}

export function OnboardingModal({ open, onClose, rol }: Props) {
  const pasos = rol === 'empleado' ? PASOS_EMPLEADO : PASOS_ADMIN
  const [i, setI] = useState(0)
  const paso = pasos[i]
  const esUltimo = i === pasos.length - 1

  function handleClose() {
    setI(0)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Primeros pasos" size="sm">
      <div className="space-y-4">
        <div className="flex gap-1.5">
          {pasos.map((_, idx) => (
            <span
              key={idx}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: idx <= i ? 'var(--brand-500)' : 'var(--surface-2)' }}
            />
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-2">{paso.titulo}</h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{paso.texto}</p>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={handleClose}>
            {esUltimo ? 'Cerrar' : 'Saltar'}
          </Button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="secondary" onClick={() => setI(i - 1)}>
                Atrás
              </Button>
            )}
            {!esUltimo && <Button onClick={() => setI(i + 1)}>Siguiente</Button>}
            {esUltimo && <Button onClick={handleClose}>Entendido</Button>}
          </div>
        </div>
      </div>
    </Modal>
  )
}
