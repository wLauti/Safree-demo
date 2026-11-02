import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ saved: [] })

  const { data } = await supabase
    .from('saved_items')
    .select('product_id')
    .eq('user_id', user.id)

  return NextResponse.json({ saved: (data ?? []).map((r: { product_id: string }) => r.product_id) })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await request.json()

  // Toggle: delete if exists, insert if not
  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .single()

  if (existing) {
    await supabase.from('saved_items').delete().eq('id', (existing as { id: string }).id)
    return NextResponse.json({ saved: false })
  } else {
    await supabase.from('saved_items').insert({ user_id: user.id, product_id } as never)
    return NextResponse.json({ saved: true })
  }
}
