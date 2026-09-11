import { useState, type InputHTMLAttributes } from 'react'
import { Input } from './Input'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  wrapperClassName?: string
  defaultVisible?: boolean
}

/** Input de contraseña con botón para mostrar/ocultar. Componente único, reusado en toda la plataforma. */
export function PasswordInput({ wrapperClassName = '', className = '', defaultVisible = false, ...props }: Props) {
  const [visible, setVisible] = useState(defaultVisible)

  return (
    <div className={`relative ${wrapperClassName}`}>
      <Input type={visible ? 'text' : 'password'} className={`pr-14 ${className}`} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        {visible ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  )
}
