'use client'

import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { UserRole } from '@/lib/supabase/types'

export function withRole<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  allowedRoles: UserRole[]
) {
  return function RoleGuard(props: T) {
    const { role, loading } = useRole()
    const router = useRouter()

    useEffect(() => {
      if (!loading && role && !allowedRoles.includes(role)) {
        router.replace('/unauthorized')
      }
      if (!loading && !role) {
        router.replace('/login')
      }
    }, [role, loading, router])

    if (loading) return null
    if (!role || !allowedRoles.includes(role)) return null

    return <WrappedComponent {...props} />
  }
}
