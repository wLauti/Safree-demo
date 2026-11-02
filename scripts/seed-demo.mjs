// ───────────────────────────────────────────────────────────────────────────
// Safree DEMO seed. Creates the demo accounts and fills the backend with a
// complete, ready-to-show dataset: 2 stores, 8 products, 4 experiences (with
// 60 days of availability), plus a sample paid order, a confirmed booking and
// reviews. Idempotent — safe to run more than once.
//
//   cd Safree-demo
//   node scripts/seed-demo.mjs
//
// Reads Supabase credentials from ./.env.local.
// ───────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'demo1234'
const ACCOUNTS = [
  { key: 'admin',   email: 'admin@safree.demo',   full_name: 'Admin Demo',     role: 'admin' },
  { key: 'mod',     email: 'mod@safree.demo',      full_name: 'Moderador Demo', role: 'moderator' },
  { key: 'tienda',  email: 'tienda@safree.demo',   full_name: 'Tienda Demo',    role: 'store' },
  { key: 'coto',    email: 'coto@safree.demo',     full_name: 'Coto Demo',      role: 'store' },
  { key: 'cliente', email: 'cliente@safree.demo',  full_name: 'Cliente Demo',   role: 'user' },
]

const CAT = {
  optics: '11111111-0001-0001-0001-000000000001',
  apparel: '11111111-0001-0001-0001-000000000002',
  archery: '11111111-0001-0001-0001-000000000003',
  camping: '11111111-0001-0001-0001-000000000004',
  fishing: '11111111-0001-0001-0001-000000000005',
  knives: '11111111-0001-0001-0001-000000000006',
  navigation: '11111111-0001-0001-0001-000000000007',
  accessories: '11111111-0001-0001-0001-000000000008',
}
const SPECIES = {
  whitetail: '25ff81b5-ca5e-41ae-8a97-45b329382608',
  boar: '3e681707-dbd2-4395-b949-44fad1915644',
  turkey: '31925b7b-c661-45be-955f-861155d5e2b8',
  bass: 'f820c4f5-33ba-4304-b919-bf157122596a',
}
const IMG = (n) => `/media/backgrounds/${n}.jpg`
const PRODIMG = '/media/products/807961d0-1e03-4da2-aaea-f7f6af5ed0d2/1780103828082.jpg'
// One distinct photo per demo product (downloaded locally — see public/media/products/demo/).
const PIMG = (n) => `/media/products/demo/${n}.jpg`

const STORE_A = 'de510000-0000-4000-a000-000000000001' // shop
const STORE_B = 'de510000-0000-4000-a000-000000000002' // coto

async function findByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const u = data.users.find(x => x.email === email)
    if (u) return u
    if (data.users.length < 200) break
  }
  return null
}

const ids = {}
for (const a of ACCOUNTS) {
  let user = await findByEmail(a.email)
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: a.full_name },
    })
    if (error) { console.error('createUser', a.email, error.message); process.exit(1) }
    user = data.user
    console.log('created', a.email)
  } else {
    await db.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true })
    console.log('reused ', a.email)
  }
  await db.from('profiles').upsert(
    { id: user.id, email: a.email, full_name: a.full_name, role: a.role, email_verified: true, status: 'active' },
    { onConflict: 'id' }
  )
  ids[a.key] = user.id
}

// ── Stores ──────────────────────────────────────────────────────────────────
await db.from('stores').upsert([
  {
    id: STORE_A, owner_id: ids.tienda, name: 'Outdoor Pro Shop', slug: 'outdoor-pro-shop',
    description: 'Equipo premium de caza y pesca. Tienda de demostración.', subtype: 'store',
    logo_url: IMG('campfire'), banner_url: IMG('marketplace'),
    location_state: 'Texas', location_city: 'Austin',
    is_verified: true, is_active: true, verification_status: 'verified',
    stripe_account_id: 'acct_demo_shop', stripe_onboarding_complete: true,
    stripe_charges_enabled: true, stripe_payouts_enabled: true,
  },
  {
    id: STORE_B, owner_id: ids.coto, name: 'Rancho El Venado', slug: 'rancho-el-venado',
    description: 'Coto de caza y pesca en el corazón de Texas. Demostración.', subtype: 'coto',
    logo_url: IMG('texture'), banner_url: IMG('experiences'),
    location_state: 'Texas', location_city: 'Kerrville',
    is_verified: true, is_active: true, verification_status: 'verified',
    stripe_account_id: 'acct_demo_coto', stripe_onboarding_complete: true,
    stripe_charges_enabled: true, stripe_payouts_enabled: true,
  },
], { onConflict: 'id' })
console.log('stores seeded')

// ── Products (Store A) ──────────────────────────────────────────────────────
const P = (n) => `de520000-0000-4000-a000-0000000000${String(n).padStart(2, '0')}`
const products = [
  { n: 1, title: 'Binoculares 10x42 HD',        price: 299.99, cat: CAT.optics,      cond: 'new',  stock: 12, desc: 'Ópticos de alta definición para avistaje a larga distancia.' },
  { n: 2, title: 'Campera de Caza Camuflada',   price: 149.99, cat: CAT.apparel,     cond: 'new',  stock: 20, desc: 'Impermeable, silenciosa y térmica. Patrón woodland.' },
  { n: 3, title: 'Arco Compuesto Pro',          price: 549.00, cat: CAT.archery,     cond: 'new',  stock: 6,  desc: 'Arco compuesto ajustable, 70 lb, listo para cazar.' },
  { n: 4, title: 'Carpa 4 Estaciones',          price: 399.00, cat: CAT.camping,     cond: 'new',  stock: 8,  desc: 'Resistente al viento y la nieve, para 3 personas.' },
  { n: 5, title: 'Combo de Pesca con Mosca',    price: 189.50, cat: CAT.fishing,     cond: 'new',  stock: 15, desc: 'Caña, reel y línea. Ideal para trucha y bass.' },
  { n: 6, title: 'Set de Cuchillos de Monte',   price: 89.99,  cat: CAT.knives,      cond: 'new',  stock: 25, desc: 'Acero inoxidable, 3 piezas con funda.' },
  { n: 7, title: 'GPS de Mano Trail',           price: 249.00, cat: CAT.navigation,  cond: 'used', stock: 4,  desc: 'GPS portátil con mapas topográficos. Usado, excelente estado.' },
  { n: 8, title: 'Cámara Trampa 4K',            price: 119.99, cat: CAT.accessories, cond: 'new',  stock: 18, desc: 'Visión nocturna y detección de movimiento.' },
]
await db.from('products').upsert(products.map(p => ({
  id: P(p.n), store_id: STORE_A, category_id: p.cat, title: p.title, slug: `demo-${p.n}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
  description: p.desc, price: p.price, images: [PIMG(p.n)], stock: p.stock, condition: p.cond,
  status: 'active', state_location: 'Texas',
})), { onConflict: 'id' })
console.log('products seeded')

// ── Experiences (Store B) ───────────────────────────────────────────────────
const E = (n) => `de530000-0000-4000-a000-0000000000${String(n).padStart(2, '0')}`
const experiences = [
  { n: 1, title: 'Cacería de Ciervo Cola Blanca', price: 850, days: 3, max: 4, type: 'hunt',    sp: [SPECIES.whitetail], lng: -99.14, lat: 30.05, img: 'hero' },
  { n: 2, title: 'Fin de Semana de Jabalí',       price: 450, days: 2, max: 6, type: 'hunt',    sp: [SPECIES.boar],      lng: -99.20, lat: 30.02, img: 'discover' },
  { n: 3, title: 'Pesca de Bass Guiada',          price: 300, days: 1, max: 4, type: 'fishing', sp: [SPECIES.bass],      lng: -99.10, lat: 30.08, img: 'experiences' },
  { n: 4, title: 'Cacería de Pavo',               price: 600, days: 2, max: 3, type: 'hunt',    sp: [SPECIES.turkey],    lng: -99.17, lat: 30.00, img: 'list-land' },
]
for (const e of experiences) {
  const row = {
    id: E(e.n), store_id: STORE_B, title: e.title,
    slug: `demo-exp-${e.n}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    description: `${e.title}. Experiencia de demostración guiada en Rancho El Venado, con alojamiento disponible.`,
    price_per_person: e.price, max_guests: e.max, duration_days: e.days, min_booking_days: 1,
    images: [IMG(e.img)], location_name: 'Rancho El Venado', location_state: 'Texas', location_city: 'Kerrville',
    location_coords: `SRID=4326;POINT(${e.lng} ${e.lat})`,
    type: e.type, species_ids: e.sp, amenities: ['guide', 'meals', 'equipment'],
    addon_prices: { guide: 120, meals: 45, equipment: 80 }, cancellation_policy: 'moderate', status: 'active',
  }
  const { error } = await db.from('experiences').upsert(row, { onConflict: 'id' })
  if (error) { // geography literal may be rejected on some setups — retry without coords
    delete row.location_coords
    await db.from('experiences').upsert(row, { onConflict: 'id' })
    console.log('  exp', e.n, 'seeded without coords (', error.message, ')')
  }
}
console.log('experiences seeded')

// ── Availability: next 60 days for each experience ──────────────────────────
const avail = []
const today = new Date()
for (const e of experiences) {
  for (let d = 2; d < 62; d++) {
    const day = new Date(today); day.setDate(today.getDate() + d)
    avail.push({ experience_id: E(e.n), date: day.toISOString().slice(0, 10), slots: e.max, slots_booked: 0, is_blocked: false })
  }
}
await db.from('availability').upsert(avail, { onConflict: 'experience_id,date' })
console.log('availability seeded (', avail.length, 'rows )')

// ── A sample PAID order (cliente buys from the shop) ────────────────────────
const ORDER_ID = 'de540000-0000-4000-a000-000000000001'
const orderItems = [
  { product_id: P(1), store_id: STORE_A, title: 'Binoculares 10x42 HD', price: 299.99, quantity: 1, image_url: PIMG(1) },
  { product_id: P(6), store_id: STORE_A, title: 'Set de Cuchillos de Monte', price: 89.99, quantity: 2, image_url: PIMG(6) },
]
const orderSub = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
await db.from('orders').upsert({
  id: ORDER_ID, user_id: ids.cliente, store_id: STORE_A, items: orderItems,
  subtotal: orderSub, tax: 0, shipping_total: 9.99, discount: 0, total: orderSub + 9.99,
  status: 'paid', paid_at: new Date().toISOString(), shipping_method: 'Standard Shipping',
  shipping_address: { full_name: 'Cliente Demo', line1: '123 Ranch Rd', city: 'Austin', state: 'Texas', zip: '78701', country: 'US' },
}, { onConflict: 'id' })
console.log('sample order seeded')

// ── A confirmed BOOKING (cliente books an experience) ───────────────────────
const BOOKING_ID = 'de550000-0000-4000-a000-000000000001'
const bStart = new Date(today); bStart.setDate(today.getDate() + 10)
const bEnd = new Date(today); bEnd.setDate(today.getDate() + 13)
const bSub = 850 * 2 * 3
await db.from('bookings').upsert({
  id: BOOKING_ID, user_id: ids.cliente, experience_id: E(1), store_id: STORE_B,
  guests: 2, start_date: bStart.toISOString().slice(0, 10), end_date: bEnd.toISOString().slice(0, 10),
  ref_number: 'SAF-DEMO01', subtotal: bSub, addons: [{ key: 'guide', label: 'Professional Guide', price: 360 }],
  addons_total: 360, service_fee: Math.round((bSub + 360) * 0.05 * 100) / 100, total: bSub + 360 + Math.round((bSub + 360) * 0.05 * 100) / 100,
  cancellation_policy: 'moderate', status: 'confirmed', paid_at: new Date().toISOString(),
}, { onConflict: 'id' })
console.log('sample booking seeded')

// ── Reviews (fires store-rating recompute triggers) ─────────────────────────
await db.from('reviews').upsert([
  { ref_type: 'order', ref_id: ORDER_ID, user_id: ids.cliente, store_id: STORE_A, rating: 5, body: 'Excelente equipo y envío rápido. Muy recomendable.', status: 'active' },
  { ref_type: 'booking', ref_id: BOOKING_ID, user_id: ids.cliente, store_id: STORE_B, rating: 5, body: 'Una experiencia de caza inolvidable, guía de primera.', status: 'active' },
], { onConflict: 'ref_type,ref_id,user_id' })
console.log('reviews seeded')

console.log('\n✅ Demo listo. Cuentas (contraseña demo1234):')
ACCOUNTS.forEach(a => console.log('   ' + a.email.padEnd(24) + ' — ' + a.role))
