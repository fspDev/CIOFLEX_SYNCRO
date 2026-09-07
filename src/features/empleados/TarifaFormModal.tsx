import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { fijarTarifa } from '../../lib/repo'
import { monthStartOf, todayStr, formatDate } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  empleadoId: string
}

/** Fija el valor-hora vigente desde el 1° del mes actual — no reescribe historial pasado. */
export function TarifaFormModal({ open, onClose, onSaved, empleadoId }: Props) {
  const [valorHora, setValorHora] = useState(0)
  const [saving, setSaving] = useState(false)
  const vigenteDesde = monthStartOf(todayStr())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (valorHora <= 0) return
    setSaving(true)
    try {
      await fijarTarifa(empleadoId, valorHora, vigenteDesde)
      onSaved()
      onClose()
      setValorHora(0)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Actualizar valor de la hora" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nuevo valor por hora">
          <MontoInput value={valorHora} onChange={setValorHora} />
        </Field>
        <p className="text-xs text-[var(--text-muted)]">
          Rige desde el {formatDate(vigenteDesde)}. Las jornadas ya cargadas conservan el valor de la hora vigente al momento en que se registraron.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || valorHora <= 0}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
