import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Borde bien visible (--input-border, con más contraste que --border) para que quede claro
// a simple vista que el recuadro es un campo donde se puede escribir, no solo texto plano.
const base =
  'w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border-[1.5px] border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20 transition-colors text-sm'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const placeholder = props.placeholder ?? (props.type === 'number' ? 'Ingresá un número' : props.type ? undefined : 'Ingresá un texto')
  return <input {...props} placeholder={placeholder} className={base + ' ' + (props.className ?? '')} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={base + ' ' + (props.className ?? '')} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const placeholder = props.placeholder ?? 'Ingresá un texto'
  return <textarea {...props} placeholder={placeholder} className={base + ' ' + (props.className ?? '')} />
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{children}</label>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
