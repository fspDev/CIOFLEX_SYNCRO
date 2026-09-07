// Se guarda en localStorage (por dispositivo/navegador) si ya vio la guía de primeros pasos.
// No es crítico que se pierda al limpiar el navegador — solo evita mostrarla de nuevo sin necesidad.
const KEY_PREFIX = 'onboarding-visto:'

export function onboardingVisto(uid: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + uid) === '1'
  } catch {
    return true // si falla el storage, no insistimos con la guía
  }
}

export function marcarOnboardingVisto(uid: string) {
  try {
    localStorage.setItem(KEY_PREFIX + uid, '1')
  } catch {
    // sin acceso a localStorage (modo privado, etc.) — no rompe nada
  }
}
