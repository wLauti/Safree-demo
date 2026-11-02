# Safree — Versión DEMO (simulación para mostrar al cliente)

Esta carpeta es una copia de Safree configurada en **modo demo**: pagos, emails y
alta de cuentas están **simulados** (sin Stripe real, sin emails reales). Trae
cuentas y datos de prueba listos para recorrer **toda** la página delante del cliente.

La versión normal/productiva está en la carpeta `Safree` (al lado de esta).

---

## Puesta en marcha (2 pasos)

### 1) Sembrar cuentas y datos de demo (una sola vez)
```bash
cd Safree-demo
node scripts/seed-demo.mjs
```
Esto crea las **5 cuentas de prueba** y llena el backend con 2 tiendas, 8 productos,
4 experiencias (con 60 días de disponibilidad), un pedido pagado, una reserva
confirmada y reseñas. Es **idempotente**: se puede volver a correr sin duplicar nada.

> Nota: este paso crea cuentas de acceso, por eso lo corrés vos (una operación
> sensible). Usa las credenciales de `.env.local` y el Admin API de Supabase.

### 2) Levantar la demo
```bash
npm run dev      # arranca en http://localhost:3001
```
(`node_modules` está enlazado a la carpeta `Safree`, así que no hace falta instalar
nada. Si movés esta carpeta a otra máquina, corré `npm install` primero.)

Abrí **http://localhost:3001** y entrá con un botón de cuenta de prueba.

---

## Cuentas de prueba

Todas usan la contraseña **`demo1234`**. En la pantalla de login hay un botón por cada una:

| Cuenta | Email | Qué puede hacer |
|---|---|---|
| **Cliente** | `cliente@safree.demo` | Comprar productos, reservar experiencias, dejar reseñas |
| **Tienda** | `tienda@safree.demo` | Panel de tienda: productos, pedidos, envíos |
| **Coto** | `coto@safree.demo` | Panel de coto: experiencias, disponibilidad, reservas |
| **Moderador** | `mod@safree.demo` | Cola de moderación, reportes, verificación de tiendas |
| **Admin** | `admin@safree.demo` | Panel completo: usuarios, credenciales, destacados, disputas |

---

## Qué está simulado en modo demo

| Flujo | Comportamiento demo |
|---|---|
| **Pago de compra** | Al "Continuar al pago" la compra se confirma al instante (pedido `paid`, stock descontado) y te lleva a *Mis pedidos*. **No se usa Stripe.** |
| **Pago de reserva** | Al "Proceder al pago" la reserva queda `confirmada` y te lleva a *Mis reservas*. **No se usa Stripe.** |
| **Emails** | No se envía ningún email (todo es no-op). |
| **Login** | Botones de acceso directo con las cuentas de prueba. |

El interruptor es la variable `NEXT_PUBLIC_DEMO_MODE=true` en `.env.local`
(más la lógica en `lib/demo.ts`). En la versión normal esa variable no existe, así
que se usan los servicios reales.

---

## Diferencias con la versión normal (resumen técnico)
Archivos tocados respecto de `Safree`:
- `lib/demo.ts` — flag `IS_DEMO`, cuentas y contraseña de demo.
- `lib/email/resend.ts` — email no-op en demo.
- `app/api/checkout/create-intent/route.ts` — rama demo: marca pagado sin Stripe.
- `app/api/bookings/create-intent/route.ts` — rama demo: confirma la reserva sin Stripe.
- `app/(public)/checkout/CheckoutClient.tsx` y `booking/[experienceId]/BookingClient.tsx` — detectan la respuesta demo y van a "Mis pedidos/reservas".
- `components/forms/LoginForm.tsx` — botones de login de prueba.
- `app/layout.tsx` — sello "DEMO".
- `scripts/seed-demo.mjs` — crea cuentas + datos de demo.
- `.env.local`, `package.json` — puerto 3001 + `NEXT_PUBLIC_DEMO_MODE`.

> El backend de datos lo comparte con la versión normal (mismo proyecto Supabase).
> Los datos de demo quedan claramente identificados (emails `@safree.demo`,
> tiendas "Outdoor Pro Shop" y "Rancho El Venado").
