export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { decryptSecret, maskSecret } from '@/lib/crypto/secrets'
import { CREDENTIAL_GROUPS } from '@/lib/admin/credentials'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { CredentialsPanel } from './CredentialsPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Credentials — Safree' }

export default async function CredentialsPage() {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const { data } = await supabase.from('integration_keys').select('service, key_encrypted, updated_at')
  const map = new Map(((data ?? []) as any[]).map(r => [r.service, r]))

  // Build masked groups server-side — plaintext never leaves the server here
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

  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Credentials</h1>
        <p className="text-text-muted mb-6">Manage integration keys and platform secrets.</p>
        <Divider />
        <div className="mt-6">
          <CredentialsPanel groups={groups} />
        </div>
      </div>
    </PageWrapper>
  )
}
