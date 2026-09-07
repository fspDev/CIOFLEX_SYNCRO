import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserProfile } from '../types'

interface AuthState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  init: () => void
}

let initialized = false

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  error: null,

  init: () => {
    if (initialized) return
    initialized = true
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        set({ profile: null, loading: false })
        return
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          set({ profile: { id: user.uid, ...(snap.data() as Omit<UserProfile, 'id'>) }, loading: false })
        } else {
          // Usuario autenticado pero sin perfil en Firestore: no debería pasar en uso normal.
          set({ profile: null, loading: false, error: 'Tu cuenta no tiene un perfil asociado. Contactá al administrador.' })
        }
      } catch {
        set({ profile: null, loading: false, error: 'No se pudo cargar tu perfil.' })
      }
    })
  },

  signIn: async (email, password) => {
    set({ error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      set({ error: 'Email o contraseña incorrectos.' })
      throw new Error('auth-failed')
    }
  },

  signOut: async () => {
    await fbSignOut(auth)
    set({ profile: null })
  },
}))
