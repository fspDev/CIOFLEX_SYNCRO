import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { functions } from '../../lib/firebase'
import { listarAdministradores } from '../../lib/repo'
import { useAuthStore } from '../../store/authStore'
import type { UserProfile } from '../../types'
import { AdminFormModal } from './AdminFormModal'

export function AdministradoresPage() {
  const profile = useAuthStore((s) => s.profile)
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserProfile | undefined>(undefined)

  async function reload() {
    setLoading(true)
    setAdmins(await listarAdministradores())
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleEliminar(a: UserProfile) {
    if (!confirm(`¿Eliminar el acceso de administrador de ${a.nombre}?`)) return
    const eliminarAdmin = httpsCallable(functions, 'eliminarAdmin')
    await eliminarAdmin({ uid: a.id })
    reload()
  }

  if (profile?.rol !== 'admin_supremo') {
    return <p className="text-sm text-[var(--text-muted)]">No tenés permiso para ver esta sección.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Administradores</h1>
          <p className="text-sm text-[var(--text-muted)]">Solo el admin supremo puede crear, editar y eliminar cuentas de administrador</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setShowForm(true)
          }}
        >
          + Nuevo administrador
        </Button>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{a.nombre}</p>
                <Badge color={a.rol === 'admin_supremo' ? 'var(--brand-500)' : 'var(--partial)'}>
                  {a.rol === 'admin_supremo' ? 'Supremo' : 'Simple'}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-3">{a.email}</p>
              {a.rol === 'admin_supremo' ? (
                <p className="text-xs text-[var(--text-muted)]">No editable desde acá.</p>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setEditing(a)
                      setShowForm(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => handleEliminar(a)}>
                    Eliminar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <AdminFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={reload} admin={editing} />
    </div>
  )
}
