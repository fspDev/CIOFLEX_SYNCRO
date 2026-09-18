import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'

interface Seccion {
  to: string
  titulo: string
  descripcion: string
  icono: string
  soloSupremo?: boolean
}

const SECCIONES: Seccion[] = [
  { to: '/dashboard', titulo: 'Dashboard', descripcion: 'Balance general de la empresa', icono: '📊' },
  { to: '/empleados', titulo: 'Empleados', descripcion: 'Horas, pagos y accesos', icono: '👥' },
  { to: '/proyectos', titulo: 'Proyectos', descripcion: 'Eventos y balance comercial', icono: '📁' },
  { to: '/movimientos', titulo: 'Movimientos', descripcion: 'Flujo de caja general', icono: '💰' },
  { to: '/calendario', titulo: 'Calendario', descripcion: 'Armados, eventos y desarmes', icono: '📅' },
  { to: '/clientes', titulo: 'Clientes', descripcion: 'Base de datos y su historial', icono: '🧾' },
  { to: '/configuracion', titulo: 'Configuración', descripcion: 'Tipos de servicio y categorías', icono: '⚙️' },
  { to: '/administradores', titulo: 'Administradores', descripcion: 'Cuentas con acceso total', icono: '🔑', soloSupremo: true },
]

export function InicioPage() {
  const profile = useAuthStore((s) => s.profile)
  const secciones = SECCIONES.filter((s) => !s.soloSupremo || profile?.rol === 'admin_supremo')

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Hola, {profile?.nombre}</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Elegí una sección para empezar</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {secciones.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="p-5 h-full hover:border-[var(--brand-500)] transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl" aria-hidden>
                  {s.icono}
                </span>
                <h2 className="font-medium">{s.titulo}</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{s.descripcion}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
