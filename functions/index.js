const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()
const auth = admin.auth()

// Mismo dominio que src/lib/auth.ts (EMPLEADO_LOGIN_DOMAIN) -- si se cambia acá, cambiar también ahí.
const EMPLEADO_LOGIN_DOMAIN = 'empleados.cioflex-syncro.app'

function usuarioAEmail(usuario) {
  return `${usuario}@${EMPLEADO_LOGIN_DOMAIN}`
}

// Traduce errores de Firebase Auth a mensajes entendibles -- si no se reconoce el código,
// se loguea el error real (para verlo en `firebase functions:log`) y se devuelve uno genérico,
// para nunca dejar que una excepción sin capturar tire la función entera (eso da un 500 pelado
// en el cliente, sin ningún mensaje útil).
function relanzarErrorDeAuth(err, contexto) {
  const mensajes = {
    'auth/email-already-exists': 'Ya existe un usuario con ese nombre. Elegí otro.',
    'auth/invalid-password': 'La contraseña no es válida (mínimo 6 caracteres).',
    'auth/invalid-email': 'El usuario tiene caracteres inválidos.',
    'auth/uid-already-exists': 'Ya existe una cuenta para ese empleado.',
  }
  const mensaje = mensajes[err?.code]
  if (mensaje) throw new HttpsError('invalid-argument', mensaje)
  console.error(`Error inesperado en ${contexto}:`, err)
  throw new HttpsError('internal', 'Ocurrió un error inesperado. Volvé a intentar en un momento.')
}

async function requireCallerRol(request, allowedRoles, mensaje) {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Necesitás estar logueado.')
  const callerProfile = await db.doc(`users/${callerUid}`).get()
  const rol = callerProfile.data()?.rol
  if (!allowedRoles.includes(rol)) {
    throw new HttpsError('permission-denied', mensaje)
  }
  return { callerUid, rol }
}

/**
 * Callable que solo un admin puede invocar: crea, edita o resetea el acceso de un empleado.
 * El empleado solo maneja un "usuario" simple (sin email) -- puertas adentro se traduce
 * a un email sintético fijo, porque Firebase Auth Email/Password lo requiere.
 *
 * Se hace vía Cloud Function (Admin SDK) porque createUserWithEmailAndPassword en el
 * cliente firma automáticamente como el usuario nuevo, echando al admin de su sesión.
 *
 * data: { empleadoId, usuario, password? } -- password es requerido solo para el primer
 * acceso; si el empleado ya tiene cuenta, es opcional: sin password se edita el usuario
 * (y por lo tanto el email de login) dejando la contraseña actual intacta.
 */
exports.crearAccesoEmpleado = onCall(async (request) => {
  await requireCallerRol(request, ['admin', 'admin_supremo'], 'Solo un administrador puede generar accesos.')

  const { empleadoId } = request.data || {}
  const usuario = (request.data?.usuario || '').trim()
  const password = (request.data?.password || '').trim()
  if (!empleadoId || !usuario) {
    throw new HttpsError('invalid-argument', 'Faltan datos: empleadoId y usuario son requeridos.')
  }
  if (password && password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  const empleadoRef = db.doc(`empleados/${empleadoId}`)
  const empleadoSnap = await empleadoRef.get()
  if (!empleadoSnap.exists) throw new HttpsError('not-found', 'El empleado no existe.')
  const empleado = empleadoSnap.data()

  const email = usuarioAEmail(usuario)

  let userRecord
  try {
    if (empleado.authUid) {
      // Ya tenía cuenta: actualiza el usuario y, si se mandó una nueva, también la contraseña.
      const updates = { email }
      if (password) updates.password = password
      userRecord = await auth.updateUser(empleado.authUid, updates)
    } else {
      if (!password) {
        throw new HttpsError('invalid-argument', 'La contraseña es requerida para generar el primer acceso.')
      }
      userRecord = await auth.createUser({ email, password, displayName: `${empleado.nombre} ${empleado.apellido}` })
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    relanzarErrorDeAuth(err, 'crearAccesoEmpleado')
  }

  await db.doc(`users/${userRecord.uid}`).set({
    email,
    rol: 'empleado',
    empleadoId,
    nombre: `${empleado.nombre} ${empleado.apellido}`,
    createdAt: new Date().toISOString(),
  })

  const empleadoUpdate = { authUid: userRecord.uid, usuario }
  if (password) empleadoUpdate.passwordActual = password
  await empleadoRef.update(empleadoUpdate)

  return { uid: userRecord.uid, usuario }
})

/**
 * Solo un admin_supremo puede invocar esto: crea (o edita) una cuenta de admin simple.
 * data: { uid?, nombre, email, password? } -- uid presente = edición; password opcional en edición.
 */
exports.crearAccesoAdmin = onCall(async (request) => {
  await requireCallerRol(request, ['admin_supremo'], 'Solo el admin supremo puede gestionar cuentas de administrador.')

  const { uid } = request.data || {}
  const nombre = (request.data?.nombre || '').trim()
  const email = (request.data?.email || '').trim()
  const password = (request.data?.password || '').trim()
  if (!nombre || !email) {
    throw new HttpsError('invalid-argument', 'Faltan datos: nombre y email son requeridos.')
  }
  if (password && password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  let userRecord
  try {
    if (uid) {
      const update = { email, displayName: nombre }
      if (password) update.password = password
      userRecord = await auth.updateUser(uid, update)
    } else {
      if (!password) throw new HttpsError('invalid-argument', 'La contraseña es requerida para un admin nuevo.')
      userRecord = await auth.createUser({ email, password, displayName: nombre })
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    relanzarErrorDeAuth(err, 'crearAccesoAdmin')
  }

  await db.doc(`users/${userRecord.uid}`).set(
    {
      email,
      rol: 'admin',
      nombre,
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  )

  return { uid: userRecord.uid }
})

/** Solo un admin_supremo puede invocar esto: elimina una cuenta de admin simple (no a otro supremo). */
exports.eliminarAdmin = onCall(async (request) => {
  await requireCallerRol(request, ['admin_supremo'], 'Solo el admin supremo puede eliminar cuentas de administrador.')

  const { uid } = request.data || {}
  if (!uid) throw new HttpsError('invalid-argument', 'Falta el uid.')

  const targetSnap = await db.doc(`users/${uid}`).get()
  if (targetSnap.data()?.rol === 'admin_supremo') {
    throw new HttpsError('permission-denied', 'No se puede eliminar a un admin supremo.')
  }

  await db.doc(`users/${uid}`).delete()
  await auth.deleteUser(uid).catch(() => {})

  return { ok: true }
})
