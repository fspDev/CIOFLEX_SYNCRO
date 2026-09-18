// Capa de acceso a datos — toda lectura/escritura a Firestore pasa por acá,
// nunca directo desde los componentes.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { compareDateStr, monthStartOf, todayStr } from './utils'
import {
  CATEGORIAS_MOVIMIENTO_DEFAULT,
  TIPOS_SERVICIO_DEFAULT,
  type Cliente,
  type Empleado,
  type Jornada,
  type MovimientoCaja,
  type PagoEmpleado,
  type UserProfile,
  type PagoProyecto,
  type Proyecto,
  type TarifaEmpleado,
  type TipoServicioConfig,
} from '../types'

const col = (name: string) => collection(db, name)

// ---------- Empleados ----------

export async function crearEmpleado(data: Omit<Empleado, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  const ref = await addDoc(col('empleados'), { ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function actualizarEmpleado(id: string, data: Partial<Empleado>) {
  await updateDoc(doc(db, 'empleados', id), { ...data, updatedAt: new Date().toISOString() })
}

export async function eliminarEmpleado(id: string) {
  await deleteDoc(doc(db, 'empleados', id))
}

export async function listarEmpleados(): Promise<Empleado[]> {
  const snap = await getDocs(query(col('empleados'), orderBy('nombre')))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Empleado, 'id'>) }))
}

// ---------- Tarifas (historial de valor-hora) ----------

/** Agrega una nueva tarifa vigente desde el primer día del mes actual (o el que se indique). */
export async function fijarTarifa(empleadoId: string, valorHora: number, vigenteDesde: string = monthStartOf(todayStr())) {
  await addDoc(col('tarifas_empleado'), {
    empleadoId,
    valorHora,
    vigenteDesde,
    createdAt: new Date().toISOString(),
  })
}

export async function listarTarifas(empleadoId: string): Promise<TarifaEmpleado[]> {
  const snap = await getDocs(query(col('tarifas_empleado'), where('empleadoId', '==', empleadoId)))
  const tarifas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TarifaEmpleado, 'id'>) }))
  return tarifas.sort((a, b) => compareDateStr(a.vigenteDesde, b.vigenteDesde))
}

/** Tarifa vigente para una fecha dada: la de mayor `vigenteDesde` que sea <= fecha. */
export function tarifaVigente(tarifas: TarifaEmpleado[], fecha: string): TarifaEmpleado | undefined {
  return [...tarifas]
    .filter((t) => compareDateStr(t.vigenteDesde, fecha) <= 0)
    .sort((a, b) => compareDateStr(b.vigenteDesde, a.vigenteDesde))[0]
}

// ---------- Jornadas ----------

export async function crearJornada(data: Omit<Jornada, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  const ref = await addDoc(col('jornadas'), { ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function actualizarJornada(id: string, data: Partial<Jornada>) {
  await updateDoc(doc(db, 'jornadas', id), { ...data, updatedAt: new Date().toISOString() })
}

export async function eliminarJornada(id: string) {
  await deleteDoc(doc(db, 'jornadas', id))
}

// Migración al vuelo: jornadas creadas antes de que existiera tipoPago se asumen 'hora'
// (todo pago era por hora hasta entonces). Jornadas creadas antes de que existiera la
// validación del admin se asumen ya validadas (así no desaparece de golpe el balance
// histórico) — evita un script de migración aparte.
function normalizarJornada(id: string, data: Omit<Jornada, 'id'>): Jornada {
  return { id, ...data, tipoPago: data.tipoPago ?? 'hora', validada: data.validada ?? true }
}

export async function listarJornadasPorEmpleado(empleadoId: string): Promise<Jornada[]> {
  const snap = await getDocs(query(col('jornadas'), where('empleadoId', '==', empleadoId)))
  const jornadas = snap.docs.map((d) => normalizarJornada(d.id, d.data() as Omit<Jornada, 'id'>))
  return jornadas.sort((a, b) => compareDateStr(b.fecha, a.fecha))
}

export async function listarJornadasPorProyecto(proyectoId: string): Promise<Jornada[]> {
  const snap = await getDocs(query(col('jornadas'), where('proyectoId', '==', proyectoId)))
  return snap.docs.map((d) => normalizarJornada(d.id, d.data() as Omit<Jornada, 'id'>))
}

/** Solo impacta el balance del empleado una vez validada por un admin. */
export async function validarJornada(id: string) {
  await updateDoc(doc(db, 'jornadas', id), { validada: true, updatedAt: new Date().toISOString() })
}

export async function invalidarJornada(id: string) {
  await updateDoc(doc(db, 'jornadas', id), { validada: false, updatedAt: new Date().toISOString() })
}

// ---------- Pagos a empleados ----------

export async function crearPagoEmpleado(data: Omit<PagoEmpleado, 'id' | 'createdAt'>) {
  const ref = await addDoc(col('pagos_empleado'), { ...data, createdAt: new Date().toISOString() })
  return ref.id
}

export async function eliminarPagoEmpleado(id: string) {
  await deleteDoc(doc(db, 'pagos_empleado', id))
}

export async function listarPagosPorEmpleado(empleadoId: string): Promise<PagoEmpleado[]> {
  const snap = await getDocs(query(col('pagos_empleado'), where('empleadoId', '==', empleadoId)))
  const pagos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PagoEmpleado, 'id'>) }))
  return pagos.sort((a, b) => compareDateStr(b.fecha, a.fecha))
}

// ---------- Proyectos ----------

// empleadosIds es un espejo de asignaciones solo para que las reglas de Firestore y las
// queries puedan filtrar por empleado (ver comentario en el tipo Proyecto) — se recalcula acá
// para que ningún llamador se olvide de mantenerlo sincronizado.
function conEmpleadosIds<T extends { asignaciones?: Proyecto['asignaciones'] }>(data: T) {
  if (!data.asignaciones) return data
  return { ...data, empleadosIds: [...new Set(data.asignaciones.map((a) => a.empleadoId))] }
}

export async function crearProyecto(data: Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt' | 'empleadosIds'>) {
  const now = new Date().toISOString()
  const ref = await addDoc(col('proyectos'), { ...conEmpleadosIds(data), createdAt: now, updatedAt: now })
  return ref.id
}

export async function actualizarProyecto(id: string, data: Partial<Omit<Proyecto, 'empleadosIds'>>) {
  await updateDoc(doc(db, 'proyectos', id), { ...conEmpleadosIds(data), updatedAt: new Date().toISOString() })
}

export async function eliminarProyecto(id: string) {
  await deleteDoc(doc(db, 'proyectos', id))
}

// Migración al vuelo: proyectos creados antes de que existiera tipoServicio se asumen 'Armado'
// (era el único servicio que ofrecía la empresa hasta entonces); proyectos con el viejo
// `empleadosAsignados` (una asignación para todo el proyecto, sin día) se migran a una sola
// asignación "por día" repetida en cada día del proyecto, para no perder el dato.
function normalizarProyecto(id: string, data: Omit<Proyecto, 'id'> & { empleadosAsignados?: { empleadoId: string; horaInicio?: string; horaFin?: string }[] }): Proyecto {
  const { empleadosAsignados, ...resto } = data
  let asignaciones = resto.asignaciones
  if (!asignaciones && empleadosAsignados) {
    const dias = diasDelProyectoInterno(resto)
    asignaciones = dias.flatMap((fecha) => empleadosAsignados.map((a) => ({ fecha, ...a })))
  }
  return { id, ...resto, tipoServicio: resto.tipoServicio ?? 'Armado', asignaciones: asignaciones ?? [], empleadosIds: resto.empleadosIds ?? [] }
}

// Copia mínima de diasDelProyecto (sin importar de proyectoEstado.ts para evitar un ciclo de
// módulos, ya que ese archivo no depende de repo.ts) — solo para la migración al vuelo de arriba.
function diasDelProyectoInterno(p: { diasTrabajo?: string[]; fechaArmadoInicio?: string; fechaArmadoFin?: string; fechaEventoInicio?: string; fechaEventoFin?: string; fechaDesarmeInicio?: string; fechaDesarmeFin?: string }): string[] {
  if (p.diasTrabajo && p.diasTrabajo.length > 0) return [...p.diasTrabajo].sort(compareDateStr)
  const dias = new Set<string>()
  function addRange(inicio?: string, fin?: string) {
    if (!inicio) return
    const [y1, m1, d1] = inicio.split('-').map(Number)
    const [y2, m2, d2] = (fin ?? inicio).split('-').map(Number)
    const cur = new Date(y1, m1 - 1, d1)
    const end = new Date(y2, m2 - 1, d2)
    while (cur <= end) {
      dias.add(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`)
      cur.setDate(cur.getDate() + 1)
    }
  }
  addRange(p.fechaArmadoInicio, p.fechaArmadoFin ?? p.fechaArmadoInicio)
  addRange(p.fechaEventoInicio, p.fechaEventoFin)
  addRange(p.fechaDesarmeInicio, p.fechaDesarmeFin)
  return [...dias].sort(compareDateStr)
}

export async function listarProyectos(): Promise<Proyecto[]> {
  const snap = await getDocs(col('proyectos'))
  return snap.docs.map((d) => normalizarProyecto(d.id, d.data() as Omit<Proyecto, 'id'>))
}

export async function listarProyectosPorEmpleado(empleadoId: string): Promise<Proyecto[]> {
  const snap = await getDocs(query(col('proyectos'), where('empleadosIds', 'array-contains', empleadoId)))
  return snap.docs.map((d) => normalizarProyecto(d.id, d.data() as Omit<Proyecto, 'id'>))
}

// ---------- Pagos de proyectos ----------

export async function crearPagoProyecto(data: Omit<PagoProyecto, 'id' | 'createdAt'>) {
  const ref = await addDoc(col('pagos_proyecto'), { ...data, createdAt: new Date().toISOString() })
  return ref.id
}

export async function eliminarPagoProyecto(id: string) {
  await deleteDoc(doc(db, 'pagos_proyecto', id))
}

export async function listarPagosPorProyecto(proyectoId: string): Promise<PagoProyecto[]> {
  const snap = await getDocs(query(col('pagos_proyecto'), where('proyectoId', '==', proyectoId)))
  const pagos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PagoProyecto, 'id'>) }))
  return pagos.sort((a, b) => compareDateStr(b.fecha, a.fecha))
}

// ---------- Clientes ----------

export async function crearCliente(data: Omit<Cliente, 'id' | 'createdAt'>) {
  const ref = await addDoc(col('clientes'), { ...data, createdAt: new Date().toISOString() })
  return ref.id
}

export async function actualizarCliente(id: string, data: Partial<Cliente>) {
  await updateDoc(doc(db, 'clientes', id), data)
}

export async function eliminarCliente(id: string) {
  await deleteDoc(doc(db, 'clientes', id))
}

export async function listarClientes(): Promise<Cliente[]> {
  const snap = await getDocs(query(col('clientes'), orderBy('nombre')))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Cliente, 'id'>) }))
}

// ---------- Administradores (colección `users`, roles admin/admin_supremo) ----------

export async function listarAdministradores(): Promise<UserProfile[]> {
  const snap = await getDocs(query(col('users'), where('rol', 'in', ['admin', 'admin_supremo'])))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, 'id'>) }))
}

// ---------- Movimientos de caja (compra de materiales/herramientas, trabajos extra, etc.) ----------

export async function crearMovimiento(data: Omit<MovimientoCaja, 'id' | 'createdAt'>) {
  const ref = await addDoc(col('movimientos_caja'), { ...data, createdAt: new Date().toISOString() })
  return ref.id
}

export async function actualizarMovimiento(id: string, data: Partial<MovimientoCaja>) {
  await updateDoc(doc(db, 'movimientos_caja', id), data)
}

export async function eliminarMovimiento(id: string) {
  await deleteDoc(doc(db, 'movimientos_caja', id))
}

export async function listarMovimientos(): Promise<MovimientoCaja[]> {
  const snap = await getDocs(col('movimientos_caja'))
  const movimientos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MovimientoCaja, 'id'>) }))
  return movimientos.sort((a, b) => compareDateStr(b.fecha, a.fecha))
}

// ---------- Proyectos por cliente (historial en la ficha del cliente) ----------

export async function listarProyectosPorCliente(clienteId: string): Promise<Proyecto[]> {
  const snap = await getDocs(query(col('proyectos'), where('clienteId', '==', clienteId)))
  return snap.docs.map((d) => normalizarProyecto(d.id, d.data() as Omit<Proyecto, 'id'>))
}

// ---------- Configuración editable por el admin ----------
// Un solo documento por cada tipo de configuración, en la colección `configuracion`.

const CONFIG_TIPOS_SERVICIO_ID = 'tipos_servicio_proyecto'
const CONFIG_CATEGORIAS_MOVIMIENTO_ID = 'categorias_movimiento'

export async function obtenerTiposServicio(): Promise<TipoServicioConfig[]> {
  const snap = await getDoc(doc(db, 'configuracion', CONFIG_TIPOS_SERVICIO_ID))
  if (!snap.exists()) return TIPOS_SERVICIO_DEFAULT
  const items = snap.data().items as TipoServicioConfig[] | undefined
  return items && items.length > 0 ? items : TIPOS_SERVICIO_DEFAULT
}

export async function guardarTiposServicio(items: TipoServicioConfig[]) {
  await setDoc(doc(db, 'configuracion', CONFIG_TIPOS_SERVICIO_ID), { items })
}

export async function obtenerCategoriasMovimiento(): Promise<string[]> {
  const snap = await getDoc(doc(db, 'configuracion', CONFIG_CATEGORIAS_MOVIMIENTO_ID))
  if (!snap.exists()) return CATEGORIAS_MOVIMIENTO_DEFAULT
  const items = snap.data().items as string[] | undefined
  return items && items.length > 0 ? items : CATEGORIAS_MOVIMIENTO_DEFAULT
}

export async function guardarCategoriasMovimiento(items: string[]) {
  await setDoc(doc(db, 'configuracion', CONFIG_CATEGORIAS_MOVIMIENTO_ID), { items })
}
