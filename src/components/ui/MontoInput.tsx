import { Input } from './Input'
import { formatThousands, parseThousands } from '../../lib/utils'

interface Props {
  value: number
  onChange: (value: number) => void
  placeholder?: string
}

/** Input de monto con separador de miles en vivo mientras se tipea. Componente único, reusado en toda la plataforma. */
export function MontoInput({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
      <Input
        className="pl-7"
        inputMode="numeric"
        placeholder={placeholder ?? '0'}
        value={value ? formatThousands(value) : ''}
        onChange={(e) => onChange(parseThousands(e.target.value))}
      />
    </div>
  )
}
