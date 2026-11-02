import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: fetch authenticated user's cart from Supabase
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] })

  const { data } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity, products(id, title, slug, price, images, stock, stores(name))')
    .eq('user_id', user.id)

  return NextResponse.json({ items: data ?? [] })
}

// POST: upsert a cart item
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id, quantity } = await request.json()

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .single()

  if (existing) {
    const newQty = (existing as { id: string; quantity: number }).quantity + (quantity ?? 1)
    await supabase.from('cart_items').update({ quantity: newQty } as never)
      .eq('id', (existing as { id: string }).id)
  } else {
    await supabase.from('cart_items').insert({
      user_id: user.id,
      product_id,
      quantity: quantity ?? 1,
    } as never)
  }

  return NextResponse.json({ ok: true })
}

// DELETE: remove a cart item
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await request.json()
  await supabase.from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', product_id)

  return NextResponse.json({ ok: true })
}
