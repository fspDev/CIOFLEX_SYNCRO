import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/** Sección desplegable con un botón de acción que siempre queda visible, colapsada o no. */
export function Collapsible({ title, action, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 font-medium text-sm text-[var(--text)] hover:text-[var(--brand-400)] transition-colors"
        >
          <span className="text-xs transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          {title}
        </button>
        {action}
      </div>
      {open && children}
    </div>
  )
}
