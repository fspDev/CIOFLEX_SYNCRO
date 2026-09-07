# Puesta en marcha — Cioflex Syncro

Guía paso a paso, pensada para quien no programa. Seguí el orden.

## 1. Crear el proyecto de Firebase

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. **Agregar proyecto** → nombre `cioflex-syncro` (o el que prefieras) → seguí los pasos por defecto.
3. Dentro del proyecto, and menú lateral **Compilación**:
   - **Authentication** → pestaña *Sign-in method* → habilitá **Correo electrónico/contraseña**.
   - **Firestore Database** → **Crear base de datos** → modo producción → elegí la región más cercana (ej. `southamerica-east1`).
   - **Storage**: no es necesario para esta primera versión (no hay carga de imágenes todavía).
4. **Configuración del proyecto** (ícono de engranaje) → **Tus apps** → ícono `</>` (Web) → registrá una app (nombre: `cioflex-syncro-web`). Firebase te va a mostrar un bloque `firebaseConfig` con varias claves.

## 2. Cargar las credenciales en el proyecto

1. Copiá el archivo `.env.example` de esta carpeta y renombralo a `.env`.
2. Completá cada línea con los valores que te dio Firebase en el paso anterior (`apiKey` → `VITE_FIREBASE_API_KEY`, etc.).
3. Guardá el archivo. Nunca subas `.env` a GitHub (ya está excluido en `.gitignore`).

## 3. Probar en tu computadora (opcional, antes de publicar)

Necesitás tener [Node.js](https://nodejs.org) instalado (versión 20 o superior).

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Todavía no vas a poder loguearte porque no existe ningún usuario — eso lo hacemos en el paso 5.

## 4. Publicar el código en GitHub

1. Creá un repositorio nuevo en GitHub (puede ser privado) llamado por ejemplo `cioflex-syncro`.
2. Si el nombre del repositorio **no** es `cioflex-syncro`, avisame para ajustar el `base` en `vite.config.ts` (tiene que coincidir con `/nombre-del-repo/`).
3. Desde esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión de Cioflex Syncro"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cioflex-syncro.git
git push -u origin main
```

## 5. Activar GitHub Pages y cargar los secretos

1. En el repo de GitHub → **Settings → Pages** → en "Build and deployment" elegí **GitHub Actions** como fuente.
2. **Settings → Secrets and variables → Actions → New repository secret**. Cargá uno por uno estos 6 secretos, con los mismos valores que pusiste en tu `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Cualquier `git push` a `main` a partir de ahora dispara el deploy automáticamente (mirá la pestaña **Actions** del repo para ver el progreso). La app va a quedar publicada en `https://TU-USUARIO.github.io/cioflex-syncro/`.

## 6. Deployar las reglas de Firestore y las Cloud Functions (manual, no es automático)

Esto sí lo tenés que correr vos desde tu computadora cada vez que cambiemos reglas o funciones:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # elegí tu proyecto de Firebase
firebase deploy --only firestore:rules,functions
```

**Importante**: las Cloud Functions requieren que el proyecto de Firebase esté en el plan **Blaze** (pago por uso). Sin esto, el botón "Generar acceso" de empleados no va a funcionar. El plan Blaze tiene una capa gratuita amplia — para un equipo chico, el uso real de esta app no debería generar costo, pero Google pide una tarjeta cargada igual. Se activa desde **Configuración del proyecto → Uso y facturación** en la consola de Firebase.

## 7. Crear tu primer usuario administrador

Como no hay un botón de "registrarse" (por seguridad), el primer admin se crea a mano, una única vez:

1. En Firebase Console → **Authentication → Users → Add user**. Cargá tu email y una contraseña.
2. Copiá el **UID** que te muestra la tabla para ese usuario.
3. En Firebase Console → **Firestore Database → Iniciar colección** → nombre `users` → ID del documento: pegá ese mismo UID → agregá estos campos:
   - `email` (string): tu email
   - `rol` (string): `admin`
   - `nombre` (string): tu nombre
   - `createdAt` (string): la fecha de hoy en formato `2026-09-07T00:00:00.000Z` (o cualquier ISO)
4. Guardá. Ya podés entrar a la plataforma con ese email y contraseña.

Los empleados **no** se crean así — una vez que estés logueado como admin, desde la ficha de cada empleado vas a tener el botón **"Generar acceso"**, que crea su usuario automáticamente (necesita el paso 6 ya hecho).

---

Cuando tengas el proyecto de Firebase creado y las credenciales, avisame y seguimos: probamos el login real, cargamos los primeros empleados/proyectos, y ajustamos lo que haga falta.
