import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SortToggle, type Orden } from '../../components/ui/SortToggle'
import { listarClientes } from '../../lib/repo'
import type { Cliente } from '../../types'
import { ClienteFormModal } from './ClienteFormModal'
import { ClienteDetailPanel } from './ClienteDetailPanel'

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [orden, setOrden] = useState<Orden>('asc')

  async function reload() {
    setLoading(true)
    setClientes(await listarClientes())
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const filtrados = useMemo(() => {
    return clientes
      .filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => (orden === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)))
  }, [clientes, busqueda, orden])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-[var(--text-muted)]">Base de datos de clientes de la empresa</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nuevo cliente</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input placeholder="Buscar cliente…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-xs" />
        <SortToggle orden={orden} onChange={setOrden} label="Nombre" />
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No hay clientes que coincidan.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <Card
              key={c.id}
              className="p-4 cursor-pointer hover:border-[var(--brand-500)] transition-colors"
              onClick={() => setSelected(c)}
            >
              <p className="font-medium">{c.nombre}</p>
              <p className="text-sm text-[var(--text-muted)]">{c.telefono || '—'}</p>
              <p className="text-sm text-[var(--text-muted)]">{c.email || '—'}</p>
            </Card>
          ))}
        </div>
      )}

      <ClienteFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} />
      {selected && <ClienteDetailPanel cliente={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  )
}
