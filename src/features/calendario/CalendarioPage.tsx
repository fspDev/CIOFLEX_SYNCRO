import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { listarClientes, listarProyectos } from '../../lib/repo'
import { formatDate } from '../../lib/utils'
import type { Cliente, Proyecto } from '../../types'
import { ProyectoDetailPanel } from '../proyectos/ProyectoDetailPanel'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

type TipoFase = 'armado' | 'evento' | 'desarme'

interface DiaEvento {
  proyecto: Proyecto
  tipo: TipoFase
}

const COLOR_TIPO: Record<TipoFase, string> = {
  armado: 'var(--armado)',
  evento: 'var(--brand-500)',
  desarme: 'var(--desarme)',
}

const LABEL_TIPO: Record<TipoFase, string> = {
  armado: 'Armado',
  evento: 'Evento',
  desarme: 'Desarme',
}

/** Agrupa los eventos de un día por proyecto (un proyecto puede tener más de una fase el mismo día). */
function agruparPorProyecto(eventos: DiaEvento[]): { proyecto: Proyecto; tipos: TipoFase[] }[] {
  const orden: string[] = []
  const grupos = new Map<string, { proyecto: Proyecto; tipos: TipoFase[] }>()
  for (const ev of eventos) {
    if (!grupos.has(ev.proyecto.id)) {
      grupos.set(ev.proyecto.id, { proyecto: ev.proyecto, tipos: [] })
      orden.push(ev.proyecto.id)
    }
    const grupo = grupos.get(ev.proyecto.id)!
    if (!grupo.tipos.includes(ev.tipo)) grupo.tipos.push(ev.tipo)
  }
  return orden.map((id) => grupos.get(id)!)
}

function toDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function CalendarioPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<Proyecto | null>(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    listarProyectos().then(setProyectos)
    listarClientes().then(setClientes)
  }, [])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, DiaEvento[]>()
    function addRange(proyecto: Proyecto, inicio?: string, fin?: string, tipo: DiaEvento['tipo'] = 'evento') {
      if (!inicio) return
      const start = toDate(inicio)
      const end = fin ? toDate(fin) : start
      const cur = new Date(start)
      while (cur <= end) {
        const key = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push({ proyecto, tipo })
        cur.setDate(cur.getDate() + 1)
      }
    }
    for (const p of proyectos) {
      addRange(p, p.fechaArmadoInicio, p.fechaArmadoFin, 'armado')
      addRange(p, p.fechaEventoInicio, p.fechaEventoFin, 'evento')
      addRange(p, p.fechaDesarmeInicio, p.fechaDesarmeFin, 'desarme')
    }
    return map
  }, [proyectos])

  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const cliente = (id: string) => clientes.find((c) => c.id === id)?.nombre

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Calendario</h1>
          <p className="text-sm text-[var(--text-muted)]">Armados, eventos y desarmes del mes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            ←
          </Button>
          <span className="font-medium w-40 text-center">
            {MESES[month]} {year}
          </span>
          <Button variant="secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            →
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--armado)' }} /> Armado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-500)' }} /> Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--desarme)' }} /> Desarme
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-xs text-[var(--text-muted)] mb-1.5">
        {DIAS.map((d) => (
          <div key={d} className="text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const key = dateStr(year, month, day)
          const eventos = eventosPorDia.get(key) ?? []
          const grupos = agruparPorProyecto(eventos)
          const tieneEventos = grupos.length > 0
          const handleClickDia = () => {
            // Un solo proyecto ese día: va directo al detalle. Dos o más: siempre el listado,
            // sin importar en qué parte de la celda se clickee (incluidos los chips de evento).
            if (grupos.length === 1) setSelected(grupos[0].proyecto)
            else if (grupos.length > 1) setDiaSeleccionado(key)
          }
          return (
            <Card
              key={i}
              onClick={tieneEventos ? handleClickDia : undefined}
              className={`p-1.5 min-h-[88px] flex flex-col gap-1 ${tieneEventos ? 'cursor-pointer hover:border-[var(--brand-500)]' : ''}`}
            >
              <span className="text-xs text-[var(--text-muted)]">{day}</span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {eventos.slice(0, 3).map((ev, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] truncate text-left px-1 py-0.5 rounded"
                    style={{ background: `${COLOR_TIPO[ev.tipo]}22`, color: COLOR_TIPO[ev.tipo] }}
                    title={`${ev.proyecto.nombre} — ${cliente(ev.proyecto.clienteId) ?? ''}`}
                  >
                    {ev.proyecto.nombre}
                  </span>
                ))}
                {eventos.length > 3 && <span className="text-[10px] text-[var(--text-muted)]">+{eventos.length - 3} más</span>}
              </div>
            </Card>
          )
        })}
      </div>

      {diaSeleccionado && (
        <Modal open onClose={() => setDiaSeleccionado(null)} title={formatDate(diaSeleccionado)} size="sm">
          <div className="space-y-1.5">
            {agruparPorProyecto(eventosPorDia.get(diaSeleccionado) ?? []).map(({ proyecto, tipos }) => (
              <button
                key={proyecto.id}
                onClick={() => {
                  setSelected(proyecto)
                  setDiaSeleccionado(null)
                }}
                className="w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{proyecto.nombre}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{cliente(proyecto.clienteId) ?? '—'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {tipos.map((tipo) => (
                    <span
                      key={tipo}
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${COLOR_TIPO[tipo]}22`, color: COLOR_TIPO[tipo] }}
                    >
                      {LABEL_TIPO[tipo]}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {selected && (
        <ProyectoDetailPanel
          proyecto={selected}
          onClose={() => setSelected(null)}
          onChanged={() => listarProyectos().then(setProyectos)}
        />
      )}
    </div>
  )
}
