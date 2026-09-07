import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { eliminarCliente, listarClientes } from '../../lib/repo'
import type { Cliente } from '../../types'
import { ClienteFormModal } from './ClienteFormModal'

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Cliente | undefined>(undefined)

  async function reload() {
    setLoading(true)
    setClientes(await listarClientes())
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleEliminar(c: Cliente) {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    await eliminarCliente(c.id)
    reload()
  }

  const filtrados = clientes.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-[var(--text-muted)]">Base de datos de clientes de la empresa</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setShowForm(true)
          }}
        >
          + Nuevo cliente
        </Button>
      </div>

      <Input
        placeholder="Buscar cliente…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="max-w-xs mb-4"
      />

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No hay clientes que coincidan.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <Card key={c.id} className="p-4">
              <p className="font-medium">{c.nombre}</p>
              <p className="text-sm text-[var(--text-muted)]">{c.telefono || '—'}</p>
              <p className="text-sm text-[var(--text-muted)] mb-3">{c.email || '—'}</p>
              {c.notas && <p className="text-xs text-[var(--text-muted)] mb-3">{c.notas}</p>}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setEditing(c)
                    setShowForm(true)
                  }}
                >
                  Editar
                </Button>
                <Button variant="danger" onClick={() => handleEliminar(c)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClienteFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} cliente={editing} />
    </div>
  )
}
