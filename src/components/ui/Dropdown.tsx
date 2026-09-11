import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
}

/** Menú desplegable genérico: se cierra al clickear afuera, con Escape, o al elegir una opción. */
export function Dropdown({ trigger, children, align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors shrink-0"
        aria-label="Opciones"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute z-40 mt-1 min-w-[220px] py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors ${
        danger ? 'text-red-400' : 'text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <p className="px-3.5 pt-1.5 pb-1 text-[10px] uppercase tracking-wide font-medium text-[var(--text-muted)]">{children}</p>
}
