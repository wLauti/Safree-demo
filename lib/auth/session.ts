import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

export async function getSession() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

    return data as any as { id: string; email: string; role: UserRole; full_name: string | null; avatar_url: string | null; email_verified: boolean } | null
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!allowedRoles.includes(profile.role)) redirect('/unauthorized')
  return profile
}


