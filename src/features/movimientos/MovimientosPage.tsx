import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { eliminarMovimiento, listarMovimientos } from '../../lib/repo'
import { formatCurrency, formatDate } from '../../lib/utils'
import { CATEGORIAS_MOVIMIENTO } from '../../types'
import type { CategoriaMovimiento, MovimientoCaja, TipoMovimiento } from '../../types'
import { MovimientoFormModal } from './MovimientoFormModal'

type FiltroTipo = 'todos' | TipoMovimiento

export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MovimientoCaja | undefined>(undefined)

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaMovimiento | ''>('')

  async function reload() {
    setLoading(true)
    setMovimientos(await listarMovimientos())
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const filtrados = useMemo(() => {
    return movimientos
      .filter((m) => filtroTipo === 'todos' || m.tipo === filtroTipo)
      .filter((m) => !filtroCategoria || m.categoria === filtroCategoria)
  }, [movimientos, filtroTipo, filtroCategoria])

  const totales = useMemo(() => {
    const ingresos = filtrados.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
    const egresos = filtrados.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
    return { ingresos, egresos, neto: ingresos - egresos }
  }, [filtrados])

  async function handleEliminar(m: MovimientoCaja) {
    if (!confirm(`¿Eliminar este movimiento (${formatCurrency(m.monto)})?`)) return
    await eliminarMovimiento(m.id)
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Movimientos</h1>
          <p className="text-sm text-[var(--text-muted)]">Compra de materiales/herramientas, trabajos extra y otros gastos o ingresos sueltos</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setShowForm(true)
          }}
        >
          + Nuevo movimiento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Ingresos</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--paid)' }}>
            {loading ? '…' : formatCurrency(totales.ingresos)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Egresos</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--debt)' }}>
            {loading ? '…' : formatCurrency(totales.egresos)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Neto</p>
          <p className="text-xl font-semibold" style={{ color: totales.neto >= 0 ? 'var(--paid)' : 'var(--debt)' }}>
            {loading ? '…' : formatCurrency(totales.neto)}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)} className="max-w-[160px]">
          <option value="todos">Ingresos y egresos</option>
          <option value="ingreso">Solo ingresos</option>
          <option value="egreso">Solo egresos</option>
        </Select>
        <Select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as CategoriaMovimiento | '')}
          className="max-w-[200px]"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_MOVIMIENTO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No hay movimientos que coincidan con el filtro.</Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((m) => (
            <Card key={m.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatDate(m.fecha)} · {m.categoria}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{m.descripcion}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-medium" style={{ color: m.tipo === 'ingreso' ? 'var(--paid)' : 'var(--debt)' }}>
                  {m.tipo === 'ingreso' ? '+' : '−'} {formatCurrency(m.monto)}
                </p>
                <button
                  onClick={() => {
                    setEditing(m)
                    setShowForm(true)
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs"
                >
                  Editar
                </button>
                <button onClick={() => handleEliminar(m)} className="text-[var(--text-muted)] hover:text-red-400 text-xs">
                  Eliminar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MovimientoFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={reload}
        movimiento={editing}
      />
    </div>
  )
}
