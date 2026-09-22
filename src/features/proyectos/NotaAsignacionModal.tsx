import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Textarea } from '../../components/ui/Input'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (nota: string) => Promise<void>
  notaInicial: string
}

/** Nota de cambios de último momento sobre la asignación de un empleado a un día del proyecto. */
export function NotaAsignacionModal({ open, onClose, onSave, notaInicial }: Props) {
  const [nota, setNota] = useState(notaInicial)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNota(notaInicial)
  }, [open, notaInicial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(nota.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cambio de último momento" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nota">
          <Textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={3}
            placeholder="Ej: entró 2 horas más tarde, lo reemplazó otro, se retiró antes…"
          />
        </Field>

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
