'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDebounce } from './useDebounce'

interface SearchResult {
  products: { id: string; title: string; slug: string | null; images: string[]; price: number; stores: { name: string } | null }[]
  experiences: { id: string; title: string; images: string[]; price_per_person: number; location_state: string | null }[]
}

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<SearchResult>({ products: [], experiences: [] })
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ products: [], experiences: [] })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search(debouncedQuery)
  }, [debouncedQuery, search])

  return { results, loading }
}
