import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input, Field } from '../../components/ui/Input'
import { asset } from '../../lib/utils'
import { loginInputAEmail } from '../../lib/auth'

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn)
  const error = useAuthStore((s) => s.error)
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(loginInputAEmail(usuario), password)
    } catch {
      // el error ya queda en el store
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <img src={asset('logo-white.png')} alt="Cioflex Syncro" className="h-14 object-contain" />
        </div>
        <h1 className="text-lg font-semibold text-center mb-1">Iniciar sesión</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">Ingresá con tu usuario y contraseña</p>

        <div className="space-y-4">
          <Field label="Usuario">
            <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} required autoFocus autoCapitalize="none" />
          </Field>
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
