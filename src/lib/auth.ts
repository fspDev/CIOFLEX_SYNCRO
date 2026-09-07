// Firebase Auth con Email/Password requiere si o si un identificador con formato de email.
// Para que los empleados tengan un "usuario" simple (sin @, sin dominio real), lo convertimos
// a un email sintetico fijo puertas adentro -- nunca se les muestra ni se les pide un email.
// Mismo dominio usado tambien en functions/index.js (crearAccesoEmpleado) -- si se cambia aca,
// cambiar tambien ahi.
export const EMPLEADO_LOGIN_DOMAIN = 'empleados.cioflex-syncro.app'

const DIACRITICS = /[̀-ͯ]/g

/** Normaliza un nombre de usuario simple: minusculas, sin espacios ni acentos. */
export function normalizarUsuario(usuario: string): string {
  return usuario
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/\s+/g, '.')
}

export function usuarioAEmail(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${EMPLEADO_LOGIN_DOMAIN}`
}

/** Lo que escribe la persona al loguearse puede ser el email real del admin o un usuario simple de empleado. */
export function loginInputAEmail(input: string): string {
  const value = input.trim()
  return value.includes('@') ? value : usuarioAEmail(value)
}
