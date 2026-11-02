# Onboarding y traspaso para desarrolladores

Esta guía lleva a un desarrollador que nunca vio el código desde un clon limpio
hasta tener la app funcionando, explica cómo está armado el sistema y las
convenciones a seguir, y lista el trabajo pendiente para llevar la plataforma a
producción.

Leela de principio a fin una vez; después, usá los enlaces de cada sección como
referencia.

> La documentación dentro de `docs/technical/`, `docs/user/` y `docs/legal/` está
> redactada en inglés. Este documento y el `README.md` raíz están en español.

---

## 1. Qué es Safree

Una plataforma de marketplace + reservas hecha con Next.js 14. Se venden dos cosas:

1. **Productos** — equipamiento outdoor, vendido por **tiendas** y enviado a los compradores.
2. **Experiencias** — cacerías/pesca guiadas en campos privados (**cotos**),
   reservadas para fechas concretas con pago protegido por escrow.

Cinco roles, cada uno con su propio panel: **usuario** (comprador), **tienda**,
**coto**, **moderador**, **administrador**. El acceso se controla tanto en el
middleware (nivel de ruta) como en la base de datos (seguridad a nivel de fila).

Para la arquitectura completa, leé `technical/architecture.md` después de esta guía.

---

## 2. Requisitos previos

- **Node.js 18+** y npm
- **PostgreSQL 14+** — un proyecto de Supabase o un servidor autoalojado
- Cuentas en los servicios externos que quieras habilitar (ver §7). Ninguno es
  obligatorio solo para levantar la app en local contra una base existente.

---

## 3. Puesta en marcha desde cero

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno local
cp .env.local.example .env.local
#    → completá los valores (ver §6)

# 3. Apuntar a una base de datos (ver §5)

# 4. Levantar el servidor de desarrollo
npm run dev          # http://localhost:3000
```

Las pruebas E2E necesitan navegadores la primera vez:

```bash
npx playwright install
```

---

## 4. Comandos del día a día

| Comando | Propósito |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` / `npm run start` | Build de producción / servirlo |
| `npm run lint` | ESLint |
| `npm test` | Unitarias + integración (Vitest) |
| `npm run test:coverage` | Reporte de cobertura actual → `coverage/` |
| `npm run test:e2e` | Punta a punta (Playwright) |
| `npm run rls-audit` | Verificar las políticas de seguridad a nivel de fila |

---

## 5. Base de datos

La app se comunica con PostgreSQL a través de las librerías cliente de Supabase.
Tenés dos opciones.

### Opción A — Supabase (lo más rápido)
Creá un proyecto en Supabase y configurá las tres variables
`NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY`. El esquema, las funciones y
las políticas RLS ya están aplicados en el proyecto existente; para un proyecto
nuevo, aplicá el SQL de `database/` (ver abajo).

### Opción B — PostgreSQL autoalojada (sin dependencia de Supabase)
Todo lo necesario está exportado como SQL plano en `database/`. Seguí
`database/00_README.md` y cargá, en este orden:

1. `01_schema.sql` — extensiones, enums, 24 tablas, constraints, índices, funciones, triggers
2. `02_auth_users.sql` — identidades de usuario + hashes bcrypt de contraseñas (**sensible**)
3. `03_data.sql` — datos de referencia y de semilla (las URLs de imágenes/fuentes son rutas locales)
4. `04_rls_policies.sql` — políticas de seguridad a nivel de fila

Requiere las extensiones `postgis`, `pgcrypto` y `uuid-ossp` (todas de código abierto).

Después de cargar, ejecutá `npm run rls-audit` para confirmar que cada tabla está protegida.

---

## 6. Variables de entorno

Todas las variables están listadas y agrupadas en `.env.local.example`. Resumen:

| Variable(s) | Habilita | ¿Obligatoria? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Base de datos + autenticación | **Sí** |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` | URLs absolutas, CORS, emails | **Sí** |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Pagos, Connect, escrow | Para checkout/cobros |
| `RESEND_API_KEY` | Email transaccional | Para email |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Notificaciones web push | Para push |
| `ENCRYPTION_MASTER_KEY` | Cifra las credenciales de integraciones en reposo (`openssl rand -hex 32`) | Para almacenar credenciales en el admin |
| `CRON_SECRET` | Autentica los trabajos programados (`/api/cron/*`) | Para cron |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Monitoreo de errores | Opcional |

**Nunca subas `.env.local` al repositorio.** Está en `.gitignore`. Tratá la clave
de servicio (service-role), `ENCRYPTION_MASTER_KEY` y todas las claves secretas
como secretos de producción.

---

## 7. Servicios externos y cómo reemplazarlos

La app está diseñada para que cada integración quede aislada detrás de un módulo
pequeño. Para cambiar de proveedor, modificá ese módulo — no los puntos de uso.

| Servicio | Para qué | Módulo | Notas de autoalojado / reemplazo |
|---|---|---|---|
| **Supabase** | Postgres, Auth, Storage | `lib/supabase/` | La base es portable (`database/`). Auth (GoTrue) y Storage se pueden autoalojar con el stack de Supabase, o reemplazar por otro proveedor reescribiendo este módulo. |
| **Stripe Connect** | Pagos, escrow, comisión | código de pagos en `lib/` + `app/api/checkout`, `app/api/bookings`, `app/api/stripe` | Requiere una cuenta de Stripe con Connect habilitado y un endpoint de webhook. |
| **Resend** | Email | `lib/email/resend.ts` | Cambialo por cualquier SMTP/ESP reimplementando este único módulo. |
| **Web Push (VAPID)** | Notificaciones | rutas de servidor de web-push | Generá las claves con `web-push generate-vapid-keys`. |
| **Leaflet + OSM + CARTO** | Mapas | `components/maps/` | Sin API key; las teselas vienen de CARTO/OSM. Autoalojá las teselas si el volumen lo requiere. |
| **Sentry** | Monitoreo de errores | `components/SentryInit`, instrumentación | Opcional; omití el DSN para desactivarlo. |

Las imágenes y las fuentes web se **sirven localmente** desde `public/` — la app no
depende de ningún CDN externo para los activos.

---

## 8. Convenciones y patrones

Seguí esto para que el código nuevo sea consistente con el existente.

- **Guard de autenticación del lado del servidor.** Toda ruta de API y server
  action pasa por `lib/api/guard.ts`, que resuelve el usuario, carga el rol desde la
  base, valida la entrada con Zod y devuelve una forma de error consistente. Agregá
  rutas nuevas de la misma manera; nunca confíes en un rol que venga del cliente.
- **RLS primero.** La base de datos controla el acceso de forma independiente de la
  app. Cuando agregues una tabla, agregá sus políticas (y extendé
  `04_rls_policies.sql`), luego volvé a correr `npm run rls-audit`.
- **Server Components por defecto.** Obtené los datos en el servidor; pasá a un
  client component (`'use client'`) solo cuando necesites interactividad.
- **Validación con Zod** en cada frontera de confianza (entrada de API, envío de formularios).
- **Sistema de diseño.** Reutilizá las primitivas de `components/ui` y los tokens de
  diseño de `styles/` en lugar de estilos ad-hoc.
- **Búsqueda de registros por slug o id.** Las páginas de detalle aceptan cualquiera
  de los dos; ramificá según si el parámetro es un UUID antes de consultar (ver
  `app/(public)/products/[slug]/page.tsx`).
- **El estado** que debe compartirse entre componentes vive en `store/` (Zustand);
  el estado de UI de una sola vista queda local.

---

## 9. La build de demostración (`Safree-demo`)

Una carpeta hermana, `Safree-demo`, es una copia configurada para demos al cliente.
**No** es un producto aparte — el mismo código, con un interruptor de demo.

- `NEXT_PUBLIC_DEMO_MODE=true` (en su `.env.local`) activa:
  - pagos simulados — el checkout y la reserva se completan al instante, sin llamar a Stripe;
  - email como no-op (no se envía nada);
  - botones de acceso directo para las cinco cuentas de prueba precargadas.
- El interruptor y los helpers de datos de demo están en `lib/demo.ts`; las ramas
  de demo están en las rutas de API de checkout/booking y sus componentes cliente.
- `scripts/seed-demo.mjs` crea las cuentas de prueba y siembra tiendas, productos,
  experiencias, disponibilidad, un pedido y una reserva de muestra, y reseñas.
- Las instrucciones completas y la lista de cuentas están en `Safree-demo/DEMO_README.md`.

Al construir features, desarrollá contra la build normal; la demo las hereda
automáticamente salvo que una feature toque pagos/email (ahí agregá una rama de demo).

---

## 10. Cómo extender la app

**Agregar una página:** creá una ruta bajo `app/(public)` o `app/(dashboard)`;
obtené los datos en el server component; reutilizá las primitivas de `components/ui`.

**Agregar una ruta de API:** creá `app/api/<nombre>/route.ts`; envolvé el handler
con el guard de `lib/api/guard.ts`; definí un esquema Zod para la entrada.

**Agregar una tabla:** escribí el DDL (agregalo al esquema y a
`database/01_schema.sql` para el export autoalojado), creá sus políticas RLS (y
`04_rls_policies.sql`), regenerá los tipos si usás tipos generados, y luego corré
`npm run rls-audit`.

**Agregar un email:** agregá una plantilla/llamada en `lib/email/resend.ts`; ya es
un no-op en modo demo.

---

## 11. Trabajo pendiente para llegar a producción

La aplicación está funcionalmente completa para un lanzamiento suave (ver
`RETROSPECTIVE.md`). El trabajo pendiente es de integración, configuración y
endurecimiento para el lanzamiento:

- [ ] **Aprovisionar la base de datos** (proyecto de Supabase o autoalojada según
      `database/`) y correr `npm run rls-audit`.
- [ ] **Cargar los secretos de producción** en cada variable de la §6 — en
      particular las claves **live** de Stripe, un dominio de envío verificado en
      Resend, claves VAPID nuevas, una `ENCRYPTION_MASTER_KEY` real y un
      `CRON_SECRET` fuerte.
- [ ] **Configurar el webhook de Stripe** y definir `STRIPE_WEBHOOK_SECRET`;
      verificar el alta de Connect y los flujos de cobro de punta a punta primero en
      modo de prueba.
- [ ] **Programar los trabajos cron** (`app/api/cron/*`) en tu host (por ejemplo
      Vercel Cron) para que la liberación de escrow y la limpieza corran a diario.
- [ ] **Definir el dominio canónico** y `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL`.
- [ ] **Correr la suite completa de pruebas** (`npm test`, `npm run test:e2e`)
      contra el entorno objetivo.
- [ ] **Revisar las páginas legales** de `docs/legal/` con asesoría legal antes de lanzar.
- [ ] **Pasada de accesibilidad y rendimiento** en las páginas públicas.
- [ ] **App móvil complementaria** — ver `mobile/README.md` para su estado.

Recorré `docs/PRE_LAUNCH_CHECKLIST.md` y `docs/LAUNCH_RUNBOOK.md` para la secuencia
completa de lanzamiento.

---

## 12. Resolución de problemas

| Síntoma | Causa probable |
|---|---|
| Página en blanco / error 500 al arrancar | Variables de Supabase faltantes o incorrectas |
| Errores en checkout/reserva | Claves de Stripe o secreto de webhook sin configurar |
| No llegan emails | Falta `RESEND_API_KEY`, o el dominio de envío no está verificado |
| Una página de detalle da 404 | Búsqueda por slug/UUID — el registro no está `active`, o el slug no coincide |
| `/unauthorized` en una página pública | El prefijo del guard de ruta coincidió de más — los guards coinciden en un límite de ruta |
| RLS niega una lectura/escritura válida | Falta la política para esa tabla/rol — corré `npm run rls-audit` |

---

## 13. Mapa de documentación

| Tema | Archivo |
|---|---|
| Arquitectura | `technical/architecture.md` |
| Esquema de base de datos | `technical/database.md` · autoalojado: `../database/00_README.md` |
| Referencia de la API | `technical/api.md` |
| Seguridad | `technical/security.md` |
| Pagos | `technical/stripe.md` |
| Scripts | `technical/scripts.md` |
| Pruebas | `TESTING.md` |
| Producción y lanzamiento | `PRODUCTION.md`, `PRE_LAUNCH_CHECKLIST.md`, `LAUNCH_RUNBOOK.md` |
| Guías de usuario | `user/` |
| Legal | `legal/` |
| Historial del build | `RETROSPECTIVE.md` |
