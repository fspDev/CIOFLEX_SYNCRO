import { useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import type { Jornada } from '../../types'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface Props {
  open: boolean
  onClose: () => void
  jornadas: Jornada[]
}

/** Calendario de solo lectura: marca los días que el empleado cargó como trabajados. */
export function DiasTrabajadosModal({ open, onClose, jornadas }: Props) {
  const [cursor, setCursor] = useState(() => new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const porDia = useMemo(() => {
    const map = new Map<string, Jornada[]>()
    for (const j of jornadas) {
      if (!map.has(j.fecha)) map.set(j.fecha, [])
      map.get(j.fecha)!.push(j)
    }
    return map
  }, [jornadas])

  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <Modal open={open} onClose={onClose} title="Días trabajados" size="md">
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ←
        </Button>
        <span className="font-medium">
          {MESES[month]} {year}
        </span>
        <Button variant="secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          →
        </Button>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--paid)' }} /> Validada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--partial)' }} /> Pendiente
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-[var(--text-muted)] mb-1">
        {DIAS.map((d) => (
          <div key={d} className="text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const key = dateStr(year, month, day)
          const jornadasDelDia = porDia.get(key) ?? []
          const validada = jornadasDelDia.some((j) => j.validada)
          const pendiente = jornadasDelDia.some((j) => !j.validada)
          return (
            <div
              key={i}
              className="aspect-square flex items-center justify-center rounded-lg text-sm relative"
              style={{
                background: jornadasDelDia.length > 0 ? 'var(--surface-2)' : 'transparent',
                color: jornadasDelDia.length > 0 ? 'var(--text)' : 'var(--text-muted)',
              }}
              title={jornadasDelDia.length > 0 ? `${jornadasDelDia.length} jornada(s)` : undefined}
            >
              {day}
              {jornadasDelDia.length > 0 && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: validada ? 'var(--paid)' : pendiente ? 'var(--partial)' : 'transparent' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
