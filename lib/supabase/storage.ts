import { createClient } from './client'

const BUCKETS = {
  products: 'products',
  stores: 'stores',
  avatars: 'avatars',
} as const

export async function uploadProductImage(
  file: File,
  storeId: string
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${storeId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKETS.products)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKETS.products).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadStoreImage(
  file: File,
  storeId: string,
  type: 'logo' | 'banner'
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${storeId}/${type}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKETS.stores)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKETS.stores).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(url: string): Promise<void> {
  const supabase = createClient()
  // Extract path from full URL
  const marker = `/storage/v1/object/public/${BUCKETS.products}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from(BUCKETS.products).remove([path])
}
