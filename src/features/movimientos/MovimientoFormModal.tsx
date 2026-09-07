import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { MontoInput } from '../../components/ui/MontoInput'
import { actualizarMovimiento, crearMovimiento } from '../../lib/repo'
import { todayStr } from '../../lib/utils'
import { CATEGORIAS_MOVIMIENTO } from '../../types'
import type { CategoriaMovimiento, FormaPago, MovimientoCaja, TipoMovimiento } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  movimiento?: MovimientoCaja
}

export function MovimientoFormModal({ open, onClose, onSaved, movimiento }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento?.tipo ?? 'egreso')
  const [categoria, setCategoria] = useState<CategoriaMovimiento>(movimiento?.categoria ?? 'Materiales')
  const [descripcion, setDescripcion] = useState(movimiento?.descripcion ?? '')
  const [monto, setMonto] = useState(movimiento?.monto ?? 0)
  const [fecha, setFecha] = useState(movimiento?.fecha ?? todayStr())
  const [formaPago, setFormaPago] = useState<FormaPago>(movimiento?.formaPago ?? 'efectivo')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (monto <= 0) return
    setSaving(true)
    try {
      const data = { tipo, categoria, descripcion, monto, fecha, formaPago }
      if (movimiento) {
        await actualizarMovimiento(movimiento.id, data)
      } else {
        await crearMovimiento(data)
      }
      onSaved()
      onClose()
      if (!movimiento) {
        setDescripcion('')
        setMonto(0)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={movimiento ? 'Editar movimiento' : 'Nuevo movimiento'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('egreso')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border-[1.5px] transition-colors ${
                tipo === 'egreso'
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'border-[var(--input-border)] text-[var(--text-muted)]'
              }`}
            >
              Egreso (gasto)
            </button>
            <button
              type="button"
              onClick={() => setTipo('ingreso')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border-[1.5px] transition-colors ${
                tipo === 'ingreso'
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : 'border-[var(--input-border)] text-[var(--text-muted)]'
              }`}
            >
              Ingreso
            </button>
          </div>
        </div>

        <Field label="Categoría">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaMovimiento)}>
            {CATEGORIAS_MOVIMIENTO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descripción">
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} required />
        </Field>

        <Field label="Monto">
          <MontoInput value={monto} onChange={setMonto} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || monto <= 0}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
