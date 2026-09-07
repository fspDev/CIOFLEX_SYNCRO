const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()
const auth = admin.auth()

/**
 * Callable que solo un admin puede invocar: crea (o resetea) el acceso de un empleado.
 * Se hace vía Cloud Function (Admin SDK) porque createUserWithEmailAndPassword en el
 * cliente firma automáticamente como el usuario nuevo, echando al admin de su sesión.
 *
 * data: { empleadoId, email, password }
 */
exports.crearAccesoEmpleado = onCall(async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Necesitás estar logueado.')

  const callerProfile = await db.doc(`users/${callerUid}`).get()
  if (callerProfile.data()?.rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo un administrador puede generar accesos.')
  }

  const { empleadoId, email, password } = request.data || {}
  if (!empleadoId || !email || !password) {
    throw new HttpsError('invalid-argument', 'Faltan datos: empleadoId, email y password son requeridos.')
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  const empleadoRef = db.doc(`empleados/${empleadoId}`)
  const empleadoSnap = await empleadoRef.get()
  if (!empleadoSnap.exists) throw new HttpsError('not-found', 'El empleado no existe.')
  const empleado = empleadoSnap.data()

  let userRecord
  if (empleado.authUid) {
    // Ya tenía cuenta: resetear contraseña / actualizar email en vez de duplicar.
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

  await empleadoRef.update({ authUid: userRecord.uid, email })

  return { uid: userRecord.uid }
})
