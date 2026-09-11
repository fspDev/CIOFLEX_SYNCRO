import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { EmpleadosPage } from './features/empleados/EmpleadosPage'
import { ProyectosPage } from './features/proyectos/ProyectosPage'
import { ClientesPage } from './features/clientes/ClientesPage'
import { CalendarioPage } from './features/calendario/CalendarioPage'
import { MisHorasPage } from './features/empleado-portal/MisHorasPage'
import { MisProyectosPage } from './features/empleado-portal/MisProyectosPage'
import { MisPagosPage } from './features/empleado-portal/MisPagosPage'
import { AdministradoresPage } from './features/administradores/AdministradoresPage'
import { MovimientosPage } from './features/movimientos/MovimientosPage'

function App() {
  const init = useAuthStore((s) => s.init)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-muted)] text-sm">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return <LoginPage />
  }

  return (
    <BrowserRouter basename="/CIOFLEX_SYNCRO">

      <Routes>
        <Route element={<AppLayout />}>
          {profile.rol === 'admin' || profile.rol === 'admin_supremo' ? (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/empleados" element={<EmpleadosPage />} />
              <Route path="/proyectos" element={<ProyectosPage />} />
              <Route path="/movimientos" element={<MovimientosPage />} />
              <Route path="/calendario" element={<CalendarioPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              {profile.rol === 'admin_supremo' && <Route path="/administradores" element={<AdministradoresPage />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<MisHorasPage />} />
              <Route path="/mis-proyectos" element={<MisProyectosPage />} />
              <Route path="/mis-pagos" element={<MisPagosPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
