import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

/**
 * GET /api/experiences/[slug]/availability?year=2025&month=6
 * Returns availability rows for the given month.
 */
export async function GET(req: Request, { params }: Props) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const supabase = createClient()

  // Resolve experience ID from slug or UUID
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const { data: exp } = isUuid
    ? await supabase.from('experiences').select('id').eq('id', params.slug).single()
    : await supabase.from('experiences').select('id').eq('slug', params.slug).single()

  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('availability')
    .select('id, date, slots, slots_booked, is_blocked')
    .eq('experience_id', (exp as any).id)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date')

  return NextResponse.json({ availability: data ?? [], experienceId: (exp as any).id })
}

/**
 * POST /api/experiences/[slug]/availability
 * Upsert availability for a date range (store owners only).
 * Body: { dates: [{ date, slots, is_blocked }] }
 */
export async function POST(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dates } = await req.json()
  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: 'dates array required' }, { status: 400 })
  }

  // Verify ownership
  const isUuid = /^[0-9a-f-]{36}$/.test(params.slug)
  const query = supabase
    .from('experiences')
    .select('id, store_id, stores(owner_id)')
  const { data: exp } = isUuid
    ? await (query.eq('id', params.slug).single())
    : await (query.eq('slug', params.slug).single())

  const e = exp as any
  if (!e || e.stores?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const rows = dates.map((d: any) => ({
    experience_id: e.id,
    date: d.date,
    slots: d.slots ?? 0,
    is_blocked: d.is_blocked ?? false,
  }))

  const { error } = await service
    .from('availability')
    .upsert(rows, { onConflict: 'experience_id,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
