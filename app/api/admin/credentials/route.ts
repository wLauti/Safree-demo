export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/crypto/secrets'
import { findField, CREDENTIAL_GROUPS } from '@/lib/admin/credentials'
import { logAuditEvent } from '@/lib/audit'

async function getAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return null
  return { id: user.id, email: (profile as any).email as string }
}

/** Re-verify the admin's password without disturbing the active session. */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  const tmp = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } } // no cookie writes — isolated check
  )
  const { error } = await tmp.auth.signInWithPassword({ email, password })
  return !error
}

// GET → masked list of all credentials (no plaintext)
export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { data } = await service.from('integration_keys').select('service, key_encrypted, updated_at')
  const rows = (data ?? []) as any[]

  const map = new Map(rows.map(r => [r.service, r]))
  const groups = CREDENTIAL_GROUPS.map(g => ({
    name: g.name,
    fields: g.fields.map(f => {
      const row = map.get(f.service)
      const decrypted = row ? (f.encrypted ? decryptSecret(row.key_encrypted) : row.key_encrypted) : ''
      return {
        service: f.service,
        label: f.label,
        encrypted: f.encrypted,
        type: f.type ?? 'text',
        hint: f.hint ?? null,
        masked: f.encrypted ? maskSecret(decrypted) : (decrypted || '(not set)'),
        isSet: !!decrypted,
        updatedAt: row?.updated_at ?? null,
      }
    }),
  }))

  return NextResponse.json({ groups })
}

// POST → action-based: { action: 'reauth' | 'reveal' | 'update', password, service?, value? }
export async function POST(req: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, password, service, value } = await req.json()

  if (!password || !(await verifyPassword(admin.email, password))) {
    return NextResponse.json({ error: 'Password incorrect' }, { status: 401 })
  }

  if (action === 'reauth') {
    return NextResponse.json({ ok: true })
  }

  const supabaseService = createServiceClient()

  if (action === 'reveal') {
    if (!service) return NextResponse.json({ error: 'service required' }, { status: 400 })
    const field = findField(service)
    const { data } = await supabaseService.from('integration_keys').select('key_encrypted').eq('service', service).single()
    const stored = (data as any)?.key_encrypted ?? ''
    const plain = field?.encrypted ? decryptSecret(stored) : stored

    await logAuditEvent({
      actor_id: admin.id, actor_role: 'admin',
      action: 'credential_revealed', target_type: 'integration_key', target_id: service,
    })
    return NextResponse.json({ value: plain })
  }

  if (action === 'update') {
    if (!service) return NextResponse.json({ error: 'service required' }, { status: 400 })
    const field = findField(service)
    const stored = field?.encrypted ? encryptSecret(value ?? '') : (value ?? '')

    const { error } = await supabaseService
      .from('integration_keys')
      .upsert({ service, key_encrypted: stored, updated_at: new Date().toISOString() } as any, { onConflict: 'service' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAuditEvent({
      actor_id: admin.id, actor_role: 'admin',
      action: 'credential_updated', target_type: 'integration_key', target_id: service,
      metadata: { encrypted: field?.encrypted ?? false },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
