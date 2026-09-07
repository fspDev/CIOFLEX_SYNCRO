import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-500)] transition-colors text-sm'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={base + ' ' + (props.className ?? '')} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={base + ' ' + (props.className ?? '')} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={base + ' ' + (props.className ?? '')} {...props} />
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
