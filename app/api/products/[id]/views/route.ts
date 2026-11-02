import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()
  // Increment without exposing current count — uses Postgres RPC
  await supabase.rpc('increment_product_views', { product_id: params.id })
  return NextResponse.json({ ok: true })
}
