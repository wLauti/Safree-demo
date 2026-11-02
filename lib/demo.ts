// DEMO / SIMULATION mode helpers. Active only when NEXT_PUBLIC_DEMO_MODE=true
// (see .env.local). In demo mode the app simulates payments and emails and
// offers one-click sign-in with the pre-seeded demo accounts.

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

/** Shared password for every demo account (created by scripts/seed-demo.mjs). */
export const DEMO_PASSWORD = 'demo1234'

/** The demo accounts shown as quick-login buttons on the sign-in page. */
export const DEMO_ACCOUNTS = [
  { label: 'Cliente',   email: 'cliente@safree.demo', desc: 'Comprar y reservar' },
  { label: 'Tienda',    email: 'tienda@safree.demo',  desc: 'Vende equipo' },
  { label: 'Coto',      email: 'coto@safree.demo',    desc: 'Ofrece experiencias' },
  { label: 'Moderador', email: 'mod@safree.demo',     desc: 'Aprueba publicaciones' },
  { label: 'Admin',     email: 'admin@safree.demo',   desc: 'Panel completo' },
] as const
