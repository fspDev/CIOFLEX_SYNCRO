import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { actualizarJornada, crearJornada, listarProyectos, listarTarifas, tarifaVigente } from '../../lib/repo'
import { useAuthStore } from '../../store/authStore'
import { hoursBetween, todayStr } from '../../lib/utils'
import type { Jornada, Proyecto, TipoCargaJornada, TipoPagoJornada } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleadoId: string
  jornada?: Jornada // presente = editar; ausente = cargar nueva
}

export function JornadaFormModal({ open, onClose, onSaved, empleadoId, jornada }: Props) {
  const rol = useAuthStore((s) => s.profile?.rol)
  // Solo un admin puede elegir "por trabajo" (monto fijo) -- un empleado autocargándose
  // su jornada siempre es por hora (también reforzado en las reglas de Firestore).
  const esAdmin = rol === 'admin' || rol === 'admin_supremo'

  const [fecha, setFecha] = useState(todayStr())
  const [tipoCarga, setTipoCarga] = useState<TipoCargaJornada>('horas')
  const [horas, setHoras] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [tipoPago, setTipoPago] = useState<TipoPagoJornada>('hora')
  const [montoFijo, setMontoFijo] = useState(0)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    listarProyectos().then(setProyectos)
    setFecha(jornada?.fecha ?? todayStr())
    setTipoCarga(jornada?.tipoCarga ?? 'horas')
    setHoras(jornada ? String(jornada.horas) : '')
    setHoraInicio(jornada?.horaInicio ?? '')
    setHoraFin(jornada?.horaFin ?? '')
    setDescripcion(jornada?.descripcion ?? '')
    setProyectoId(jornada?.proyectoId ?? '')
    setTipoPago(jornada?.tipoPago === 'trabajo' && esAdmin ? 'trabajo' : 'hora')
    setMontoFijo(jornada?.montoFijo ?? 0)
    setError(null)
  }, [open, jornada, esAdmin])

  const horasCalculadas = useMemo(() => {
    if (tipoCarga === 'horas') return Number(horas) || 0
    if (horaInicio && horaFin) return hoursBetween(horaInicio, horaFin)
    return 0
  }, [tipoCarga, horas, horaInicio, horaFin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const base = {
        empleadoId,
        fecha,
        tipoCarga,
        horas: horasCalculadas,
        horaInicio: tipoCarga === 'rango' ? horaInicio : undefined,
        horaFin: tipoCarga === 'rango' ? horaFin : undefined,
        descripcion,
        proyectoId: proyectoId || undefined,
      }

      let data: Omit<Jornada, 'id' | 'createdAt' | 'updatedAt'>
      if (tipoPago === 'trabajo' && esAdmin) {
        if (!montoFijo) {
          setError('Ingresá el monto fijo acordado para este trabajo.')
          setSaving(false)
          return
        }
        data = { ...base, tipoPago: 'trabajo', montoFijo, montoTotal: montoFijo }
      } else {
        const tarifas = await listarTarifas(empleadoId)
        const tarifa = tarifaVigente(tarifas, fecha)
        if (!tarifa) {
          setError('Este empleado todavía no tiene un valor de hora asignado. Fijalo primero desde su ficha.')
          setSaving(false)
          return
        }
        data = {
          ...base,
          tipoPago: 'hora',
          valorHora: tarifa.valorHora,
          montoTotal: Math.round(horasCalculadas * tarifa.valorHora),
        }
      }

      if (jornada) {
        await actualizarJornada(jornada.id, data)
      } else {
        await crearJornada(data)
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={jornada ? 'Editar jornada' : 'Cargar jornada'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Fecha">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </Field>

        {esAdmin && (
          <Field label="Forma de pago">
            <Select value={tipoPago} onChange={(e) => setTipoPago(e.target.value as TipoPagoJornada)}>
              <option value="hora">Por hora</option>
              <option value="trabajo">Por trabajo (monto fijo)</option>
            </Select>
          </Field>
        )}

        {tipoPago === 'trabajo' && esAdmin && (
          <Field label="Monto fijo del trabajo">
            <MontoInput value={montoFijo} onChange={setMontoFijo} />
          </Field>
        )}

        {tipoPago !== 'trabajo' && (
          <>
            <Field label="Tipo de carga">
              <Select value={tipoCarga} onChange={(e) => setTipoCarga(e.target.value as TipoCargaJornada)}>
                <option value="horas">Cantidad de horas</option>
                <option value="rango">Rango horario</option>
              </Select>
            </Field>

            {tipoCarga === 'horas' ? (
              <Field label="Horas trabajadas">
                <Input type="number" step="0.5" min="0" value={horas} onChange={(e) => setHoras(e.target.value)} required />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Desde">
                  <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
                </Field>
                <Field label="Hasta">
                  <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
                </Field>
              </div>
            )}

            {tipoCarga === 'rango' && horaInicio && horaFin && (
              <p className="text-xs text-[var(--text-muted)]">Total: {horasCalculadas} hs</p>
            )}
          </>
        )}

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

        <Field label="Descripción">
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} required />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : jornada ? 'Guardar cambios' : 'Guardar jornada'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
