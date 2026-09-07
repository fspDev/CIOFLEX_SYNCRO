import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { listarClientes, listarProyectos } from '../../lib/repo'
import type { Cliente, Proyecto } from '../../types'
import { ProyectoDetailPanel } from '../proyectos/ProyectoDetailPanel'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface DiaEvento {
  proyecto: Proyecto
  tipo: 'armado' | 'evento' | 'desarme'
}

const COLOR_TIPO: Record<DiaEvento['tipo'], string> = {
  armado: 'var(--armado)',
  evento: 'var(--brand-500)',
  desarme: 'var(--desarme)',
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
      addRange(p, p.fechaArmadoInicio, p.fechaArmadoInicio, 'armado')
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
          return (
            <Card key={i} className="p-1.5 min-h-[88px] flex flex-col gap-1">
              <span className="text-xs text-[var(--text-muted)]">{day}</span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {eventos.slice(0, 3).map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelected(ev.proyecto)}
                    className="text-[10px] truncate text-left px-1 py-0.5 rounded"
                    style={{ background: `${COLOR_TIPO[ev.tipo]}22`, color: COLOR_TIPO[ev.tipo] }}
                    title={`${ev.proyecto.nombre} — ${cliente(ev.proyecto.clienteId) ?? ''}`}
                  >
                    {ev.proyecto.nombre}
                  </button>
                ))}
                {eventos.length > 3 && <span className="text-[10px] text-[var(--text-muted)]">+{eventos.length - 3} más</span>}
              </div>
            </Card>
          )
        })}
      </div>

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
