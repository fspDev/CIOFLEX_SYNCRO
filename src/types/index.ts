// Convención de fechas: toda fecha sin hora se guarda como string 'YYYY-MM-DD'
// (evita corrimientos de huso horario). Timestamps con hora real usan ISO completo.

// admin_supremo: acceso total + gestiona cuentas de admin_simple.
// admin: acceso total a la plataforma (empleados, proyectos, clientes, calendario), pero no puede
// crear/editar/eliminar otras cuentas de administrador.
export type Rol = 'admin_supremo' | 'admin' | 'empleado'

export interface UserProfile {
  id: string // uid de Firebase Auth
  email: string
  rol: Rol
  empleadoId?: string // solo si rol === 'empleado', referencia a empleados/{id}
  nombre: string
  createdAt: string
}

export interface Empleado {
  id: string
  nombre: string
  apellido: string
  telefono: string
  usuario?: string // usuario simple de acceso (sin email), se define al generar el acceso
  passwordActual?: string // última contraseña asignada, guardada para poder compartirla de nuevo sin resetear
  activo: boolean
  authUid?: string // uid de Firebase Auth una vez creada la cuenta
  createdAt: string
  updatedAt: string
}

// Historial de valor-hora: nunca se sobreescribe, se agrega una entrada nueva
// con la fecha desde la que rige. La jornada consulta la vigente al cargarse
// y congela ese valor en el propio documento de jornada.
export interface TarifaEmpleado {
  id: string
  empleadoId: string
  valorHora: number
  vigenteDesde: string // 'YYYY-MM-DD', primer día del mes en que rige
  createdAt: string
}

export type TipoCargaJornada = 'horas' | 'rango'

// hora: se cobra horas * valorHora (comportamiento histórico). trabajo: monto fijo acordado
// para ese trabajo puntual, independiente de las horas registradas. Solo un admin puede
// cargar una jornada 'trabajo' — un empleado autocargándose sus horas siempre es 'hora'.
export type TipoPagoJornada = 'hora' | 'trabajo'

export interface Jornada {
  id: string
  empleadoId: string
  fecha: string // 'YYYY-MM-DD'
  tipoCarga: TipoCargaJornada
  horas: number // siempre calculado: cantidad directa, o diff de horaInicio/horaFin
  horaInicio?: string // 'HH:mm', solo si tipoCarga === 'rango'
  horaFin?: string
  descripcion: string
  proyectoId?: string // opcional: jornada puede ser "suelta" o ligada a un proyecto
  tipoPago: TipoPagoJornada
  valorHora?: number // congelado al momento de la carga (vigente ese mes); solo si tipoPago === 'hora'
  montoFijo?: number // monto acordado para el trabajo; solo si tipoPago === 'trabajo'
  montoTotal: number // horas * valorHora, o montoFijo si es por trabajo — siempre calculado y guardado
  // Una jornada cargada por el propio empleado no impacta en su balance hasta que un admin la
  // valida. Las que carga o edita un admin quedan validadas de una.
  validada: boolean
  createdAt: string
  updatedAt: string
}

export type FormaPago = 'efectivo' | 'transferencia' | 'otro'

export interface PagoEmpleado {
  id: string
  empleadoId: string
  monto: number
  fecha: string // 'YYYY-MM-DD'
  formaPago: FormaPago
  nota?: string
  createdAt: string
}

export type EstadoComercialProyecto = 'negociacion' | 'confirmado' | 'cancelado'

// El tipo de servicio es un nombre libre editable por el admin (ver Configuración), no un enum
// fijo — referencia por nombre a un item de TipoServicioConfig.
export type TipoServicioProyecto = string

// Asignación de un empleado a un día puntual del proyecto — no necesariamente el mismo
// empleado hace todos los días de un trabajo (ej. mantenimiento de 2 días con gente distinta).
export interface AsignacionDia {
  fecha: string // 'YYYY-MM-DD'
  empleadoId: string
  horaInicio?: string
  horaFin?: string
}

export interface Proyecto {
  id: string
  nombre: string
  ubicacion: string
  clienteId: string
  tipoServicio: TipoServicioProyecto
  // Fechas por fases: solo aplica cuando el tipo de servicio tiene usaFasesArmado = true.
  fechaArmadoInicio?: string // 'YYYY-MM-DD'
  // Si no se carga explícitamente, se guarda igual a fechaArmadoInicio (armado de un solo día).
  fechaArmadoFin?: string
  fechaEventoInicio?: string
  fechaEventoFin?: string
  fechaDesarmeInicio?: string
  fechaDesarmeFin?: string
  // Días de trabajo sueltos, no necesariamente consecutivos — solo aplica cuando el tipo de
  // servicio tiene usaFasesArmado = false (ej. mantenimiento, instalación puntual).
  diasTrabajo?: string[]
  estadoComercial: EstadoComercialProyecto
  asignaciones: AsignacionDia[]
  // Espejo de asignaciones.map(a => a.empleadoId) sin duplicados, mantenido por el repo en cada
  // escritura. Existe solo para que las reglas de Firestore y las queries puedan filtrar por
  // empleado (un array de objetos no sirve para `array-contains` ni para comparar en las reglas).
  empleadosIds: string[]
  presupuesto: number
  notas?: string
  createdAt: string
  updatedAt: string
}

export interface PagoProyecto {
  id: string
  proyectoId: string
  monto: number
  fecha: string
  formaPago: FormaPago
  nota?: string
  createdAt: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  notas?: string
  createdAt: string
}

// Estado cronológico del proyecto: 100% derivado de las fechas, nunca editado a mano.
export type EstadoCronologico =
  | 'en_desarrollo'
  | 'armado'
  | 'en_curso'
  | 'desarme'
  | 'finalizado'

export type TipoMovimiento = 'ingreso' | 'egreso'

// Valores por defecto — se usan solo para "sembrar" la configuración la primera vez.
// Desde ahí en más, la lista real vive en Firestore (colección `configuracion`) y es editable
// desde la sección Configuración.
export const CATEGORIAS_MOVIMIENTO_DEFAULT = [
  'Materiales',
  'Herramientas',
  'Trabajo extra',
  'Alquiler',
  'Transporte/Combustible',
  'Otro',
]

// La categoría es un nombre libre editable por el admin, no un enum fijo.
export type CategoriaMovimiento = string

// Flujo de caja general de la empresa, no ligado a un empleado ni a un proyecto puntual:
// compra de materiales/herramientas (egreso) o trabajos extra sueltos (ingreso).
export interface MovimientoCaja {
  id: string
  tipo: TipoMovimiento
  categoria: CategoriaMovimiento
  descripcion: string
  monto: number
  fecha: string // 'YYYY-MM-DD'
  formaPago: FormaPago
  createdAt: string
}

// ---------- Configuración editable por el admin ----------

export interface TipoServicioConfig {
  nombre: string
  // true = usa fechas por fases (armado/evento/desarme). false = usa una lista de días sueltos.
  usaFasesArmado: boolean
}

export const TIPOS_SERVICIO_DEFAULT: TipoServicioConfig[] = [
  { nombre: 'Armado', usaFasesArmado: true },
  { nombre: 'Mantenimiento', usaFasesArmado: false },
  { nombre: 'Construcción', usaFasesArmado: false },
]
