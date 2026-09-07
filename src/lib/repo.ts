// Capa de acceso a datos — toda lectura/escritura a Firestore pasa por acá,
// nunca directo desde los componentes.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { compareDateStr, monthStartOf, todayStr } from './utils'
import type {
  Cliente,
  Empleado,
  Jornada,
  MovimientoCaja,
  PagoEmpleado,
  UserProfile,
  PagoProyecto,
  Proyecto,
  TarifaEmpleado,
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

export async function listarJornadasPorEmpleado(empleadoId: string): Promise<Jornada[]> {
  const snap = await getDocs(query(col('jornadas'), where('empleadoId', '==', empleadoId)))
  const jornadas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Jornada, 'id'>) }))
  return jornadas.sort((a, b) => compareDateStr(b.fecha, a.fecha))
}

export async function listarJornadasPorProyecto(proyectoId: string): Promise<Jornada[]> {
  const snap = await getDocs(query(col('jornadas'), where('proyectoId', '==', proyectoId)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Jornada, 'id'>) }))
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

export async function crearProyecto(data: Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  const ref = await addDoc(col('proyectos'), { ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function actualizarProyecto(id: string, data: Partial<Proyecto>) {
  await updateDoc(doc(db, 'proyectos', id), { ...data, updatedAt: new Date().toISOString() })
}

export async function eliminarProyecto(id: string) {
  await deleteDoc(doc(db, 'proyectos', id))
}

export async function listarProyectos(): Promise<Proyecto[]> {
  const snap = await getDocs(col('proyectos'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Proyecto, 'id'>) }))
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
