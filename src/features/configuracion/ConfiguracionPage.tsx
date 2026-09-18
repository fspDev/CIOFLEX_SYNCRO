import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  guardarCategoriasMovimiento,
  guardarTiposServicio,
  obtenerCategoriasMovimiento,
  obtenerTiposServicio,
} from '../../lib/repo'
import type { TipoServicioConfig } from '../../types'

export function ConfiguracionPage() {
  const [tipos, setTipos] = useState<TipoServicioConfig[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [nuevoTipoFases, setNuevoTipoFases] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [savingTipos, setSavingTipos] = useState(false)
  const [savingCategorias, setSavingCategorias] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [t, c] = await Promise.all([obtenerTiposServicio(), obtenerCategoriasMovimiento()])
      setTipos(t)
      setCategorias(c)
      setLoading(false)
    }
    load()
  }, [])

  async function persistirTipos(nuevos: TipoServicioConfig[]) {
    setTipos(nuevos)
    setSavingTipos(true)
    try {
      await guardarTiposServicio(nuevos)
    } finally {
      setSavingTipos(false)
    }
  }

  async function persistirCategorias(nuevas: string[]) {
    setCategorias(nuevas)
    setSavingCategorias(true)
    try {
      await guardarCategoriasMovimiento(nuevas)
    } finally {
      setSavingCategorias(false)
    }
  }

  function handleAgregarTipo() {
    const nombre = nuevoTipo.trim()
    if (!nombre || tipos.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) return
    persistirTipos([...tipos, { nombre, usaFasesArmado: nuevoTipoFases }])
    setNuevoTipo('')
    setNuevoTipoFases(false)
  }

  function handleEliminarTipo(nombre: string) {
    if (!confirm(`¿Eliminar el tipo de servicio "${nombre}"? Los proyectos que ya lo usan no se modifican.`)) return
    persistirTipos(tipos.filter((t) => t.nombre !== nombre))
  }

  function handleToggleFases(nombre: string) {
    persistirTipos(tipos.map((t) => (t.nombre === nombre ? { ...t, usaFasesArmado: !t.usaFasesArmado } : t)))
  }

  function handleAgregarCategoria() {
    const nombre = nuevaCategoria.trim()
    if (!nombre || categorias.some((c) => c.toLowerCase() === nombre.toLowerCase())) return
    persistirCategorias([...categorias, nombre])
    setNuevaCategoria('')
  }

  function handleEliminarCategoria(nombre: string) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Los movimientos que ya la usan no se modifican.`)) return
    persistirCategorias(categorias.filter((c) => c !== nombre))
  }

  if (loading) {
    return <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Configuración</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Listas editables que se usan en el resto de la plataforma</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-medium mb-1">Tipos de servicio de proyecto</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            "Con fases de armado" habilita fechas de armado/evento/desarme en el proyecto; sin esa marca, el proyecto usa una
            lista de días de trabajo sueltos (no necesariamente consecutivos).
          </p>

          <div className="space-y-2 mb-4">
            {tipos.map((t) => (
              <div key={t.nombre} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)]">
                <span className="text-sm flex-1 min-w-0 truncate">{t.nombre}</span>
                <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0">
                  <input type="checkbox" checked={t.usaFasesArmado} onChange={() => handleToggleFases(t.nombre)} className="w-3.5 h-3.5" />
                  Fases de armado
                </label>
                <button onClick={() => handleEliminarTipo(t.nombre)} className="text-[var(--text-muted)] hover:text-red-400 text-xs shrink-0">
                  Eliminar
                </button>
              </div>
            ))}
            {tipos.length === 0 && <p className="text-sm text-[var(--text-muted)]">Sin tipos cargados.</p>}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nuevo tipo de servicio"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarTipo())}
            />
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0 whitespace-nowrap">
              <input type="checkbox" checked={nuevoTipoFases} onChange={(e) => setNuevoTipoFases(e.target.checked)} className="w-3.5 h-3.5" />
              Fases
            </label>
            <Button type="button" onClick={handleAgregarTipo} disabled={savingTipos || !nuevoTipo.trim()}>
              + Agregar
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-medium mb-1">Categorías de movimientos</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Se usan al cargar un movimiento de caja (compra de materiales, herramientas, trabajos extra, etc.).
          </p>

          <div className="space-y-2 mb-4">
            {categorias.map((c) => (
              <div key={c} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)]">
                <span className="text-sm">{c}</span>
                <button onClick={() => handleEliminarCategoria(c)} className="text-[var(--text-muted)] hover:text-red-400 text-xs">
                  Eliminar
                </button>
              </div>
            ))}
            {categorias.length === 0 && <p className="text-sm text-[var(--text-muted)]">Sin categorías cargadas.</p>}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarCategoria())}
            />
            <Button type="button" onClick={handleAgregarCategoria} disabled={savingCategorias || !nuevaCategoria.trim()}>
              + Agregar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
