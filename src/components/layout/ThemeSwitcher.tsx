import { useState } from 'react'
import { getThemePref, setThemePref, type ThemePref } from '../../lib/theme'

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

export function ThemeSwitcher() {
  const [pref, setPref] = useState<ThemePref>(getThemePref)

  function handleChange(value: ThemePref) {
    setThemePref(value)
    setPref(value)
  }

  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => handleChange(o.value)}
          className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            pref === o.value ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
