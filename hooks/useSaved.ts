'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'

export function useSaved() {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchSaved = useCallback(async () => {
    if (!user) return
    const res = await fetch('/api/saved')
    const { saved } = await res.json()
    setSavedIds(new Set(saved))
  }, [user])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  const toggleSaved = async (product_id: string) => {
    if (!user) return false
    const res = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id }),
    })
    const { saved } = await res.json()
    setSavedIds(prev => {
      const next = new Set(prev)
      if (saved) next.add(product_id)
      else next.delete(product_id)
      return next
    })
    return saved as boolean
  }

  return { savedIds, toggleSaved, isSaved: (id: string) => savedIds.has(id), loading }
}
