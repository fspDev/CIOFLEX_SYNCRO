export type Orden = 'asc' | 'desc'

interface Props {
  orden: Orden
  onChange: (orden: Orden) => void
  label?: string
}

/** Botón para invertir el criterio de orden de un listado (por fecha, nombre, etc.). */
export function SortToggle({ orden, onChange, label = 'Fecha' }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(orden === 'asc' ? 'desc' : 'asc')}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-[1.5px] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
      title={`Orden ${orden === 'asc' ? 'ascendente' : 'descendente'} por ${label.toLowerCase()}`}
    >
      <span>{label}</span>
      <span aria-hidden>{orden === 'asc' ? '↑' : '↓'}</span>
    </button>
  )
}
