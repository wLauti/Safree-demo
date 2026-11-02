# Safree — Build de demostración

> Esta es la **build de demostración** de Safree, configurada con pagos y email
> simulados y datos de prueba precargados para recorridos. Ver
> [`DEMO_README.md`](DEMO_README.md) para las cuentas de demo y la puesta en marcha.
> Corre en el puerto **3001**. Todo lo que sigue describe el producto en sí.

---

Marketplace premium de productos para actividades al aire libre y plataforma de
reserva de experiencias de caza y pesca en Texas. Los compradores recorren un
marketplace curado y reservan experiencias guiadas en campos privados; las tiendas
y los *cotos* (campos de caza/pesca) administran sus propias publicaciones,
disponibilidad y cobros; moderadores y administradores mantienen la plataforma
segura.

Construido con Next.js 14 (App Router) y PostgreSQL, con Stripe Connect para pagos
y depósito en garantía (escrow).

---

## Funcionalidades

**Compradores**
- Marketplace con búsqueda, filtros, carrito y checkout (Stripe)
- Descubrimiento de campos de caza/pesca en mapa (Leaflet + OpenStreetMap)
- Reserva de experiencias con calendario de disponibilidad y pago protegido por escrow
- Pedidos, reservas, reseñas, preguntas y respuestas, lista de deseos y notificaciones web push

**Tiendas y cotos**
- Alta mediante Stripe Connect (los pagos van a la cuenta del propio vendedor)
- Gestión de productos y experiencias, disponibilidad, cumplimiento de pedidos y disputas

**Moderadores y administradores**
- Cola de moderación, verificación de tiendas, reportes
- Panel de administración: usuarios, credenciales de integraciones, publicaciones destacadas, resolución de disputas

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router, React 18, TypeScript) |
| Estilos | Tailwind CSS, sistema de diseño propio |
| Estado | Zustand |
| Base de datos | PostgreSQL 17 + PostGIS (en Supabase, o autoalojada — ver `database/`) |
| Autenticación | Supabase Auth (GoTrue), seguridad a nivel de fila (RLS) en cada tabla |
| Pagos | Stripe Connect (escrow + comisión de la plataforma) |
| Mapas | Leaflet, react-leaflet, datos de OpenStreetMap, teselas de CARTO |
| Email | Resend |
| Notificaciones | Web Push (VAPID) |
| Validación | Zod |
| Monitoreo | Sentry (opcional) |
| Pruebas | Vitest (unitarias/integración), Playwright (E2E) |

Las versiones exactas están en `docs/technical/architecture.md` y en `package.json`.

---

## Estructura del proyecto

```
app/            Rutas de Next.js — (public), (dashboard), api/
components/     Componentes de UI y de features (sistema de diseño en components/ui)
lib/            Lógica central — api/guard.ts, supabase/, email/, utils/, types/
hooks/          Hooks de React
store/          Stores de Zustand (carrito, etc.)
styles/         CSS global, tokens de diseño, fuentes autoalojadas
database/       Export SQL portable para autoalojar PostgreSQL (ver 00_README.md)
docs/           Documentación técnica, de usuario y legal
public/         Activos estáticos (imágenes y fuentes servidas localmente)
tests/          Suites de Vitest + Playwright
scripts/        Utilidades de instalación/build/test/docs (.sh y .bat)
mobile/         App móvil complementaria (ver mobile/README.md)
supabase/       Configuración del proyecto Supabase y edge functions
```

---

## Puesta en marcha

### Requisitos previos
- Node.js 18+ y npm
- Una base de datos PostgreSQL 14+ (un proyecto de Supabase, o tu propio servidor —
  ver `database/00_README.md` para la vía autoalojada)

### 1. Instalar
```bash
npm install
```

### 2. Configurar el entorno
Copiá el ejemplo y completá tus propios valores:
```bash
cp .env.local.example .env.local
```
Cada variable está documentada en `.env.local.example`. Como mínimo necesitás la URL
y las claves de Supabase y las URLs de la app; Stripe, Resend, Web Push y Sentry se
pueden agregar a medida que habilitás esas funciones.

### 3. Preparar la base de datos
- **Supabase:** apuntá las variables de entorno a tu proyecto — el esquema y las
  políticas ya están aplicados allí.
- **PostgreSQL autoalojada:** seguí `database/00_README.md` para cargar
  `01_schema.sql` → `02_auth_users.sql` → `03_data.sql` → `04_rls_policies.sql`.

### 4. Ejecutar
```bash
npm run dev          # http://localhost:3000
```

---

## Scripts

| Comando | Propósito |
|---|---|
| `npm run dev` | Levantar el servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias + integración (Vitest) |
| `npm run test:coverage` | Pruebas con reporte de cobertura |
| `npm run test:e2e` | Pruebas de punta a punta (Playwright) |
| `npm run rls-audit` | Auditar las políticas de seguridad a nivel de fila |

Hay utilidades multiplataforma para instalar/build/test/docs en `scripts/`
(`.sh` para macOS/Linux, `.bat` para Windows).

---

## Pruebas

```bash
npm test               # unitarias + integración
npm run test:e2e       # punta a punta
```

Playwright necesita descargar los navegadores la primera vez: `npx playwright install`.

---

## Despliegue

La app está pensada para un host estándar de Next.js (por ejemplo Vercel). Las notas
de producción, la checklist previa al lanzamiento y el runbook de lanzamiento están en:
- `docs/PRODUCTION.md`
- `docs/PRE_LAUNCH_CHECKLIST.md`
- `docs/LAUNCH_RUNBOOK.md`

Los trabajos programados (liberación de escrow, limpieza) se sirven desde
`app/api/cron/*` y se autentican con `CRON_SECRET`.

---

## Documentación

| Área | Ubicación |
|---|---|
| **Onboarding y traspaso para desarrolladores** | `docs/ONBOARDING.md` |
| Arquitectura | `docs/technical/architecture.md` |
| Esquema de base de datos | `docs/technical/database.md` · autoalojado: `database/00_README.md` |
| Referencia de la API | `docs/technical/api.md` |
| Modelo de seguridad | `docs/technical/security.md` |
| Pagos (Stripe) | `docs/technical/stripe.md` |
| Scripts | `docs/technical/scripts.md` |
| Guías de usuario | `docs/user/` (usuario, tienda/coto, moderador, admin) |
| Legal | `docs/legal/` |

¿Nuevo en el código? **Empezá por `docs/ONBOARDING.md`.**

> Nota: la documentación técnica, de usuario y legal dentro de `docs/` está
> redactada en inglés. Este README y `docs/ONBOARDING.md` están en español.

---

## Licencia

Software propietario. Todos los derechos reservados.
