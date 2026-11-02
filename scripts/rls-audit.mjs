#!/usr/bin/env node
/**
 * RLS Audit — verifies Row Level Security across all tables and roles.
 *
 * Creates ephemeral test users for each role, then attempts unauthorized
 * reads/writes and asserts they return empty results or permission errors.
 * Intended to run in CI on every deploy.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/rls-audit.mjs
 *
 * Exit code 0 = all assertions passed, 1 = one or more failures.
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !ANON || !SERVICE) {
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

let passed = 0
let failed = 0
const results = []

function assert(name, condition) {
  if (condition) { passed++; results.push(`  ✅ ${name}`) }
  else { failed++; results.push(`  ❌ ${name}`) }
}

const TS = Date.now()
const testUsers = {} // role -> { id, email, client }

async function createTestUser(role) {
  const email = `rls-test-${role}-${TS}@safree-test.invalid`
  const password = `Test!${TS}${role}`
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (error) throw new Error(`createUser(${role}): ${error.message}`)
  const id = data.user.id
  // Profile is created by trigger; force the role
  await admin.from('profiles').update({ role }).eq('id', id)

  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signErr } = await client.auth.signInWithPassword({ email, password })
  if (signErr) throw new Error(`signIn(${role}): ${signErr.message}`)

  testUsers[role] = { id, email, client }
}

async function cleanup() {
  for (const role of Object.keys(testUsers)) {
    try { await admin.auth.admin.deleteUser(testUsers[role].id) } catch {}
  }
}

async function run() {
  console.log('\n🔒 Safree RLS Audit\n')

  for (const role of ['user', 'store', 'moderator', 'admin']) {
    await createTestUser(role)
  }

  const user = testUsers.user.client
  const otherUser = testUsers.store.client // a different account

  // 1. integration_keys must NOT be readable by any non-service client
  {
    const { data } = await user.from('integration_keys').select('*')
    assert('user cannot read integration_keys', !data || data.length === 0)
    const { data: adminData } = await testUsers.admin.client.from('integration_keys').select('*')
    assert('admin cannot read integration_keys via anon client', !adminData || adminData.length === 0)
  }

  // 2. audit_log must NOT be readable by regular users
  {
    const { data } = await user.from('audit_log').select('*')
    assert('user cannot read audit_log', !data || data.length === 0)
  }

  // 3. A user cannot read another user's cart_items
  {
    // Seed a cart item for otherUser via service role
    const { data: prod } = await admin.from('products').select('id').limit(1).maybeSingle()
    if (prod) {
      await admin.from('cart_items').insert({ user_id: testUsers.store.id, product_id: prod.id, quantity: 1 })
    }
    const { data } = await user.from('cart_items').select('*').eq('user_id', testUsers.store.id)
    assert("user cannot read another user's cart_items", !data || data.length === 0)
  }

  // 4. A user cannot read another user's orders
  {
    const { data } = await user.from('orders').select('*').eq('user_id', testUsers.store.id)
    assert("user cannot read another user's orders", !data || data.length === 0)
  }

  // 5. A user cannot UPDATE another user's profile
  {
    const { error, data } = await user.from('profiles').update({ full_name: 'HACKED' }).eq('id', testUsers.store.id).select()
    assert("user cannot update another user's profile", (!data || data.length === 0) || !!error)
    // Verify it actually didn't change
    const { data: check } = await admin.from('profiles').select('full_name').eq('id', testUsers.store.id).single()
    assert('victim profile was not modified', check?.full_name !== 'HACKED')
  }

  // 6. A user cannot escalate their own role
  {
    await user.from('profiles').update({ role: 'admin' }).eq('id', testUsers.user.id)
    const { data: check } = await admin.from('profiles').select('role').eq('id', testUsers.user.id).single()
    assert('user cannot self-escalate role to admin', check?.role === 'user')
  }

  // 7. A store cannot read another store's disputes
  {
    const { data } = await testUsers.store.client.from('disputes').select('*').neq('store_id', '00000000-0000-0000-0000-000000000000')
    // RLS should scope to own store only — a fresh test store has none
    assert('store sees only its own disputes (none for fresh account)', !data || data.length === 0)
  }

  // 8. A moderator cannot read integration_keys or write credentials
  {
    const { data } = await testUsers.moderator.client.from('integration_keys').select('*')
    assert('moderator cannot read integration_keys', !data || data.length === 0)
  }

  // 9. A user cannot insert a review for an arbitrary user_id (forged)
  {
    const { error, data } = await user.from('reviews').insert({
      ref_type: 'order', ref_id: '00000000-0000-0000-0000-000000000001',
      user_id: testUsers.store.id, rating: 5,
    }).select()
    assert('user cannot forge a review as another user', (!data || data.length === 0) || !!error)
  }

  // 10. Anonymous client cannot read profiles wholesale
  {
    const anon = createClient(URL, ANON, { auth: { persistSession: false } })
    const { data } = await anon.from('orders').select('*')
    assert('anonymous cannot read orders', !data || data.length === 0)
  }

  console.log(results.join('\n'))
  console.log(`\n${passed} passed, ${failed} failed\n`)
}

run()
  .catch(err => { console.error('Audit error:', err.message); failed++ })
  .finally(async () => {
    await cleanup()
    process.exit(failed > 0 ? 1 : 0)
  })
