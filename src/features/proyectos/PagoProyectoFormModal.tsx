import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { crearPagoProyecto } from '../../lib/repo'
import { todayStr } from '../../lib/utils'
import type { FormaPago } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  proyectoId: string
}

export function PagoProyectoFormModal({ open, onClose, onSaved, proyectoId }: Props) {
  const [monto, setMonto] = useState(0)
  const [fecha, setFecha] = useState(todayStr())
  const [formaPago, setFormaPago] = useState<FormaPago>('transferencia')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (monto <= 0) return
    setSaving(true)
    try {
      await crearPagoProyecto({ proyectoId, monto, fecha, formaPago, nota: nota || undefined })
      onSaved()
      onClose()
      setMonto(0)
      setNota('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar cobro" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Monto cobrado">
          <MontoInput value={monto} onChange={setMonto} />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </Field>
        <Field label="Forma de pago">
          <Select value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago)}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </Select>
        </Field>
        <Field label="Nota (opcional)">
          <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || monto <= 0}>
            {saving ? 'Confirmando…' : 'Confirmar cobro'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
