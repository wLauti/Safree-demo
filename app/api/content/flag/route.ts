import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleRoute, requireUser, parseBody, ApiError } from '@/lib/api/guard'
import { contentFlagSchema } from '@/lib/validation/schemas'
import { sanitizeText } from '@/lib/sanitize'

// POST /api/content/flag
export async function POST(req: Request) {
  return handleRoute(async () => {
    const { userId } = await requireUser()
    const { ref_type, ref_id, reason, details } = await parseBody(req, contentFlagSchema)

    const supabase = createClient()
    const { error } = await supabase.from('content_flags').insert({
      ref_type,
      ref_id,
      reported_by: userId,
      reason: sanitizeText(reason, 100),
      details: details ? sanitizeText(details, 1000) : null,
    } as any)

    if (error) throw new ApiError(500, error.message)
    return NextResponse.json({ success: true })
  })
}
