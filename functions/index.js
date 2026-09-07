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

/**
 * Callable que solo un admin puede invocar: crea (o resetea) el acceso de un empleado.
 * El empleado solo maneja un "usuario" simple (sin email) -- puertas adentro se traduce
 * a un email sintético fijo, porque Firebase Auth Email/Password lo requiere.
 *
 * Se hace vía Cloud Function (Admin SDK) porque createUserWithEmailAndPassword en el
 * cliente firma automáticamente como el usuario nuevo, echando al admin de su sesión.
 *
 * data: { empleadoId, usuario, password }
 */
exports.crearAccesoEmpleado = onCall(async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Necesitás estar logueado.')

  const callerProfile = await db.doc(`users/${callerUid}`).get()
  if (callerProfile.data()?.rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo un administrador puede generar accesos.')
  }

  const { empleadoId, usuario, password } = request.data || {}
  if (!empleadoId || !usuario || !password) {
    throw new HttpsError('invalid-argument', 'Faltan datos: empleadoId, usuario y password son requeridos.')
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  const empleadoRef = db.doc(`empleados/${empleadoId}`)
  const empleadoSnap = await empleadoRef.get()
  if (!empleadoSnap.exists) throw new HttpsError('not-found', 'El empleado no existe.')
  const empleado = empleadoSnap.data()

  const email = usuarioAEmail(usuario)

  let userRecord
  if (empleado.authUid) {
    // Ya tenía cuenta: resetear contraseña / actualizar usuario en vez de duplicar.
    userRecord = await auth.updateUser(empleado.authUid, { email, password })
  } else {
    userRecord = await auth.createUser({ email, password, displayName: `${empleado.nombre} ${empleado.apellido}` })
  }

  await db.doc(`users/${userRecord.uid}`).set({
    email,
    rol: 'empleado',
    empleadoId,
    nombre: `${empleado.nombre} ${empleado.apellido}`,
    createdAt: new Date().toISOString(),
  })

  await empleadoRef.update({ authUid: userRecord.uid, usuario })

  return { uid: userRecord.uid, usuario }
})
