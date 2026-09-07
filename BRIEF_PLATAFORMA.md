# Brief de plataforma — Control X Syncro

Este documento describe la plataforma tal como quedó construida, redactado para poder **usarse como prompt** al armar un proyecto similar desde cero (mismo tipo de negocio: gestión de eventos/stands para una empresa de producción y montaje de stands feriales/congresos). Copiá y adaptá lo que aplique.

---

## 1. Qué es

Una PWA de gestión interna para una empresa que arma stands y producciones para congresos/ferias/eventos. Reemplaza planillas de Excel dispersas por un sistema único donde conviven: la agenda de eventos, el estado comercial de cada cliente dentro de un evento, las tareas de armado, la facturación/cobranza, la cuenta corriente de proveedores y los trabajos externos sueltos (no ligados a un evento).

Usuarios: un equipo chico (5-10 personas) con roles `admin`, `administrativo` y `user`. No hay clientes externos con acceso — es 100% herramienta interna.

---

## 2. Stack técnico

- **Frontend**: React 19 + TypeScript + Vite (rolldown) + TailwindCSS v4 (`@tailwindcss/vite`, variables CSS en `index.css` para theming: `--surface`, `--border`, `--bg`, etc., con soporte claro/oscuro/sistema).
- **Estado**: Zustand con middleware `persist` — pero el `persist` solo guarda un subconjunto elegido a mano (`partialize`): preferencias de UI y datos que conviene cachear offline (plantillas, tareas personales). Las colecciones grandes/compartidas (eventos, clientes) NO se persisten a disco — se recargan frescas en cada sesión vía Firestore para no arrastrar estado viejo.
- **Backend**: Firebase — Firestore (datos), Auth (login usuario/contraseña, sin registro público), Storage (imágenes de renders), Cloud Functions (notificaciones push + recordatorios programados), Cloud Messaging (push web).
- **Hosting**: GitHub Pages (build estático), deploy automático vía GitHub Actions al pushear a `main`. Las reglas/índices de Firestore y las Cloud Functions se deployan **manualmente** (`firebase deploy`) — no están en el pipeline de CI.
- **PWA**: manifest + Service Worker propio (no Workbox) que combina: mensajería FCM en background y manejo de notificaciones — el fetch handler es un no-op (no cachea nada), solo cumple el requisito de instalabilidad.

---

## 3. Modelo de datos (Firestore, colecciones top-level)

- **`events`** — el documento central. Un evento (congreso/feria) tiene fechas de armado/evento/desarme y contiene un **array embebido `proyectos`** (no subcolección): cada proyecto es el "stand" de un cliente puntual dentro de ese evento. Un evento puede tener 1 o varios proyectos (multi-cliente). Cada proyecto tiene su propio cliente, responsable, estado comercial, importe, notas, tareas y renders (imágenes).
- **`clientes`** — catálogo simple, cualquier usuario autenticado puede crear/editar.
- **`external_jobs`** (trabajos externos) — encargos puntuales que NO pertenecen a un evento (ej. un trabajo de imprenta suelto para un cliente).
- **`registros_admin`** — la parte administrativa/facturación de cada proyecto (1 doc por proyecto, creado on-demand). Guarda concepto de factura, si está facturado, y un array de **pagos parciales** (cada uno con su propia forma de pago, monto y fecha opcional) — el estado Pendiente/Parcial/Pagado se **deriva** comparando la suma cobrada contra el importe, nunca es un booleano manual.
- **`proveedores`** + **`movimientos_proveedores`** — cuenta corriente de proveedores: un ledger de movimientos (a pagar / pagado) por proveedor, con saldo corrido calculado del lado del cliente.
- **`tareas_usuario`** — tareas personales de cada usuario (pueden compartirse con otros).
- **`users`** — perfil, rol, permisos granulares por feature (ej. `permisos.ctaCteProv`), token(s) FCM, hora preferida de recordatorio.
- **`planillas`** — planillas gráficas de producción (piezas a fabricar por proyecto, con dimensiones y cantidades) exportables a PDF.
- **`config`** — configuración global (plantilla de tareas por defecto que se clona a cada proyecto nuevo, ruta de carpeta base de archivos).

**Convención de fechas**: todo lo que es "fecha sin hora" (evento, pagos, tareas) se guarda y compara como **string `YYYY-MM-DD`**, nunca como objeto `Date` ni Firestore Timestamp. Es una decisión deliberada: comparar fechas-string evita corrimientos de huso horario al convertir a local (el bug clásico de `new Date('2026-08-25')` interpretado como medianoche UTC y mostrado un día antes en un huso negativo). Los timestamps con hora real (`createdAt`, `updatedAt`) sí usan ISO completo.

---

## 4. Reglas de negocio distintivas (para replicar el "criterio", no solo el código)

1. **Estado del evento vs. estado del proyecto/stand son cosas separadas.** El estado del **evento** (En desarrollo → Armado → En curso → Desarme → Finalizado) es 100% automático, calculado en cada render comparando hoy contra las fechas cargadas — nadie lo edita a mano. El estado del **proyecto/stand** (Negociación / Confirmado / Cancelado) sí lo edita cualquier usuario manualmente. Antes de esta separación, el estado vivía todo junto en el proyecto y quedaba pegado en "Confirmado" para siempre si al evento no le habían cargado fecha de fin — separar los dos conceptos fue la forma de resolverlo de raíz.
2. **Migración automática de datos legados al leer, no con un script aparte.** Cuando el modelo cambia (ej. de evento-con-un-cliente a evento-con-varios-proyectos, o de "un solo booleano pagado" a "pagos parciales"), la función que lee de Firestore normaliza el documento viejo al vuelo (sintetiza un proyecto legacy con id determinístico, ignora campos obsoletos). Evita scripts de migración separados para la lectura; para cambios masivos de datos sí se ejecutan scripts puntuales una vez (ver más abajo).
3. **Pagos como ledger, no como booleano.** Tanto la cuenta corriente de proveedores como la facturación de proyectos modelan el dinero como una lista de movimientos/pagos (monto + forma de pago + fecha), no como un flag "pagado sí/no". El estado (Pendiente/Parcial/Pagado, o el saldo corrido) siempre se **deriva** sumando esa lista, nunca se guarda como booleano independiente que pueda desincronizarse.
4. **Confirmación explícita al cargar un pago, no autoguardado por tecleo.** La UX de carga de un pago parcial usa un "borrador" local (no persiste nada) con un botón "Confirmar pago" — así se pueden cargar varios pagos seguidos sin disparar un guardado a Firestore en cada tecla. Igual criterio para editar un pago ya cargado: botón de editar → mismo formulario con "Guardar cambios"/"Cancelar" explícitos. Los pagos ya confirmados se listan como dato fijo (fila compacta de solo lectura), nunca con el mismo aspecto que un formulario en curso.
5. **Todo campo de monto usa un input con separador de miles en vivo** (aparecen los puntos a medida que se tipea, ej. `23.000`), como regla general de toda la plataforma — un solo componente compartido (`MontoInput`), no reimplementado por pantalla.
6. **Real-time solo donde el negocio lo necesita.** `events` y `clientes` usan `onSnapshot` (tiempo real, multi-usuario). Colecciones administrativas de menor concurrencia (`registros_admin`, `trabajos`, etc.) se traen una vez al loguearse (fetch simple) con actualización optimista local — más liviano, y aceptable porque no hay edición concurrente real en esas pantallas.
7. **Reglas de Firestore defensivas contra documentos a medio crear.** En vez de `get(...).data.campo` (que revienta si el doc todavía no tiene ese campo), siempre `.get('campo', valorPorDefecto)` — para que un usuario recién creado (sin `rol` todavía) no quede bloqueado por una excepción en la regla en lugar de simplemente no tener el permiso.
8. **Multi-forma de pago y multi-pago en todos lados que involucran dinero** (no solo un método de pago único por transacción).
9. **Un evento puede tener uno o varios "stands"/proyectos** (multi-cliente por evento) — el modelo no asume 1 evento = 1 cliente.

---

## 5. Features principales (para el prompt de un proyecto nuevo)

- **Dashboard**: KPIs (eventos activos, tareas pendientes propias, clientes), próximos eventos, resumen por estado, armados de la semana.
- **Proyectos** (planilla de eventos): tabla + tarjetas mobile + vista kanban por estado automático del evento; filtros por estado y cliente; detalle de evento con sus proyectos/stands, tareas, renders (subida de imágenes con máximo de slots), fechas de armado/evento/desarme.
- **Calendario mensual**: eventos coloreados por tipo de fecha (armado/evento/desarme), alta rápida de evento haciendo clic en un día.
- **Clientes**: catálogo con vista grilla/lista, historial de eventos por cliente.
- **Trabajos externos**: encargos sueltos no ligados a un evento, con su propio estado Pendiente/Cobrado, medio de pago, responsable.
- **Administración**: dos vistas —
  - *Planilla*: cliente/evento/fecha/responsable/monto/concepto/estado de pago/facturado, ordenada por evento más próximo, con panel lateral de detalle+pagos al hacer clic en la fila.
  - *Por clientes*: tarjetas expandibles agrupadas por cliente (cobrado/pendiente agregado), ordenadas por su evento más próximo, con el mismo panel de pagos al expandir.
  - Header con métricas (Total/Cobrado/Pendiente) y filtros, mismo patrón visual que la cuenta corriente de proveedores.
- **Cuenta corriente de proveedores**: grilla estilo hoja de cálculo (alta/baja de proveedor, movimientos con forma de pago/fecha/a pagar/pagado), saldo corrido sobre el set filtrado, saldo anterior al período cuando se filtra por fecha, autosave por fila con debounce e indicador de guardado por fila.
- **Planilla gráfica de producción**: piezas a fabricar por proyecto (tipo, dimensiones, cantidad), export a PDF.
- **Mis tareas**: tareas personales con prioridad, fecha de vencimiento, posibilidad de compartir con otro usuario.
- **Notificaciones push (FCM)**: se disparan por Cloud Functions ante triggers de Firestore (asignación de responsable, tarea compartida) y por un cron horario que respeta la hora de recordatorio elegida por cada usuario (vencimiento de tareas, armado del día siguiente). Payload data-only: el Service Worker (o el JS en foreground) decide cómo mostrar la notificación, nunca Firebase automáticamente.
- **Panel de administración de usuarios**: alta de usuario, rol, permisos granulares por feature.

---

## 6. Convenciones de UI/UX a mantener

- Tema oscuro por defecto con variables CSS (`--surface`, `--surface-2`, `--border`, `--bg`), soporte de tema claro/oscuro/sistema.
- Color de marca configurable (`brand-500` etc.) usado para acciones primarias y estados "en curso"/activos.
- Colores de estado consistentes entre features: rojo = deuda/pendiente, verde = cobrado/pagado, ámbar = parcial/en negociación, violeta = fase de desmontaje, azul = fase de armado.
- Menús desplegables nativos (`<option>`) fuerzan fondo blanco + texto negro (`[&>option]:bg-white [&>option]:text-black`) porque el navegador ignora el tema oscuro heredado en ese elemento.
- Diálogos modales con overlay + click-fuera-para-cerrar, tamaños `sm/md/lg`.
- Paneles laterales deslizantes (`slide-in-from-right`) para el detalle de un ítem sin salir de la lista.
- Mobile: tarjetas en vez de tabla por debajo de cierto ancho; helpers de formato (`formatDate`, `formatCurrency`) centralizados en un único `lib/utils.ts`.

---

## 7. Cómo se resolvieron los cambios de modelo de datos en producción

Cuando un cambio de modelo requería migrar documentos existentes (no solo nuevos), el patrón fue:
1. Escribir primero el código nuevo (tipos + lectura/escritura + UI) con la lectura tolerante a datos viejos (valores por defecto sensatos si falta el campo nuevo).
2. Correr un **script de migración una sola vez**, ejecutado en la consola del navegador contra producción real (usando las mismas funciones de acceso a datos del proyecto, importadas dinámicamente), con un *dry run* impreso antes de escribir, y siempre pidiendo confirmación al usuario sobre las reglas de negocio ambiguas (ej. "¿qué forma de pago le pongo a un pago histórico del que no tengo ese dato?") antes de tocar producción.
3. Verificar el resultado releyendo directo de Firestore (no confiar en el estado optimista local de la UI).

---

## 8. Prompt sugerido para arrancar un proyecto similar

> Necesito una PWA interna (React + TypeScript + Vite + TailwindCSS v4, Firebase como backend: Firestore + Auth + Storage + Cloud Functions + Cloud Messaging) para gestionar [tu tipo de evento/proyecto recurrente]. El core es un documento "evento" con fechas de [fases relevantes] que puede tener uno o varios "proyectos/ítems" hijos, cada uno con su propio cliente, responsable, estado comercial editable a mano y estado de cronología calculado automáticamente (no lo edita nadie). Necesito una sección de administración/facturación donde el dinero se modele como una lista de pagos parciales (forma de pago + monto + fecha), nunca un booleano "pagado", con confirmación explícita al cargar cada pago (no autoguardado por tecla) y edición como acción aparte. Todas las fechas sin hora se guardan como string YYYY-MM-DD para evitar bugs de huso horario. Quiero un componente de input de monto compartido con separador de miles en vivo mientras se tipea. Deploy a GitHub Pages vía GitHub Actions en cada push a main; reglas de Firestore y Cloud Functions se deployan aparte manualmente. Tema oscuro por defecto con variables CSS y soporte claro/oscuro/sistema.
