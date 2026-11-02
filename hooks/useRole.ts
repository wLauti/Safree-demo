'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { UserRole } from '@/lib/supabase/types'

export function useRole() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
            .then(({ data }: { data: any }) => {
        setRole((data?.role as UserRole) ?? null)
        setLoading(false)
      })
  }, [user, authLoading])

  const hasRole = (roles: UserRole[]) => role !== null && roles.includes(role)

  return { role, loading: authLoading || loading, hasRole }
}


