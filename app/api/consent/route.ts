export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { handleRoute, parseBody } from '@/lib/api/guard'
import { consentSchema } from '@/lib/validation/schemas'

// POST /api/consent — persist cookie consent for logged-in users.
// (Anonymous visitors keep consent in localStorage only.)
export async function POST(req: Request) {
  return handleRoute(async () => {
    const consent = await parseBody(req, consentSchema)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const service = createServiceClient()
      await service.from('profiles').update({
        cookie_consent: { ...consent, updated_at: new Date().toISOString() },
      } as any).eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  })
}
