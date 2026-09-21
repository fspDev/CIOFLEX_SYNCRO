import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { finalizarJornada } from '../../lib/repo'
import { hoursBetween, nowTimeStr } from '../../lib/utils'
import type { Jornada } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  jornada: Jornada | null
}

/** Cierra una jornada iniciada antes (carga diferida): pide la hora de fin y calcula horas/monto. */
export function FinalizarJornadaModal({ open, onClose, onSaved, jornada }: Props) {
  const [horaFin, setHoraFin] = useState(nowTimeStr())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setHoraFin(nowTimeStr())
    setError(null)
  }, [open])

  const horasCalculadas = useMemo(() => {
    if (!jornada?.horaInicio || !horaFin) return 0
    return hoursBetween(jornada.horaInicio, horaFin)
  }, [jornada, horaFin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jornada) return
    setError(null)
    setSaving(true)
    try {
      await finalizarJornada(jornada.id, horaFin)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo finalizar la jornada.')
    } finally {
      setSaving(false)
    }
  }

  if (!jornada) return null

  return (
    <Modal open={open} onClose={onClose} title="Finalizar jornada" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">Inicio: {jornada.horaInicio} hs</p>

        <Field label="Hora de fin">
          <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
        </Field>

        <p className="text-xs text-[var(--text-muted)]">Total: {horasCalculadas} hs</p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Finalizar jornada'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
