import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// ignoreUndefinedProperties: los formularios arman objetos con campos opcionales en `undefined`
// (ej. horaInicio/horaFin cuando la jornada es por cantidad de horas) — sin esto, addDoc/updateDoc
// revientan con "invalid-argument" en vez de simplemente omitir esos campos.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const functions = getFunctions(app)
