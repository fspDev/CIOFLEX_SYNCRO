// Convención de fechas: toda fecha sin hora se guarda como string 'YYYY-MM-DD'
// (evita corrimientos de huso horario). Timestamps con hora real usan ISO completo.

export type Rol = 'admin' | 'empleado'

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
  valorHora: number // congelado al momento de la carga (vigente ese mes)
  montoTotal: number // horas * valorHora, calculado y guardado
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

export interface EmpleadoAsignado {
  empleadoId: string
  horaInicio?: string
  horaFin?: string
}

export interface Proyecto {
  id: string
  nombre: string
  ubicacion: string
  clienteId: string
  fechaArmadoInicio?: string // 'YYYY-MM-DD'
  fechaEventoInicio?: string
  fechaEventoFin?: string
  fechaDesarmeInicio?: string
  fechaDesarmeFin?: string
  estadoComercial: EstadoComercialProyecto
  empleadosAsignados: EmpleadoAsignado[]
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
