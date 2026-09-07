import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Panel lateral deslizante para ver el detalle de un ítem sin salir de la lista. */
export function SlidePanel({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-[slidein_0.2s_ease-out]">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 className="font-semibold text-[var(--text)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
      <style>{`@keyframes slidein { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  )
}
