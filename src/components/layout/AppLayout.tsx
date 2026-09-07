import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { asset } from '../../lib/utils'
import { onboardingVisto, marcarOnboardingVisto } from '../../lib/onboarding'
import { OnboardingModal } from '../onboarding/OnboardingModal'

const ADMIN_TABS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/empleados', label: 'Empleados' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/movimientos', label: 'Movimientos' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/clientes', label: 'Clientes' },
]

const ADMIN_SUPREMO_TABS = [...ADMIN_TABS, { to: '/administradores', label: 'Administradores' }]

const EMPLEADO_TABS = [
  { to: '/', label: 'Mis horas', end: true },
  { to: '/mis-pagos', label: 'Mis pagos' },
]

const ROL_LABEL: Record<string, string> = {
  admin_supremo: 'Admin supremo',
  admin: 'Administrador',
  empleado: 'Empleado',
}

export function AppLayout() {
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const tabs = profile?.rol === 'admin_supremo' ? ADMIN_SUPREMO_TABS : profile?.rol === 'admin' ? ADMIN_TABS : EMPLEADO_TABS
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (profile && !onboardingVisto(profile.id)) {
      setShowOnboarding(true)
    }
  }, [profile])

  function handleCloseOnboarding() {
    if (profile) marcarOnboardingVisto(profile.id)
    setShowOnboarding(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)]">
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)] flex md:flex-col">
        <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-[var(--border)]">
          <img src={asset('logo-white.png')} alt="" className="h-8 object-contain" />
        </div>
        <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-visible">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[var(--brand-500)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block mt-auto p-3 border-t border-[var(--border)]">
          <p className="text-sm font-medium truncate">{profile?.nombre}</p>
          <p className="text-xs text-[var(--text-muted)] mb-2 truncate">{ROL_LABEL[profile?.rol ?? '']}</p>
          <button onClick={() => setShowOnboarding(true)} className="text-xs text-[var(--brand-400)] hover:underline block mb-1">
            ¿Cómo empiezo?
          </button>
          <button onClick={() => signOut()} className="text-xs text-red-400 hover:text-red-300">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Outlet />
      </main>

      {profile && <OnboardingModal open={showOnboarding} onClose={handleCloseOnboarding} rol={profile.rol} />}
    </div>
  )
}
