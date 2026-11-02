import { createServiceClient } from '@/lib/supabase/server'

export interface ModerationFlag {
  check: 'price_range' | 'keyword_filter' | 'image_count'
  status: 'pass' | 'warn'
  message: string
}

interface ListingInput {
  title: string
  description?: string | null
  price?: number | null
  category_id?: string | null
  images: string[]
}

/**
 * Run automated checks on a listing at submission time.
 * Returns an array of flags (pass/warn) for the moderator to see.
 * These are advisory only — the moderator makes the final call.
 */
export async function runListingChecks(listing: ListingInput): Promise<ModerationFlag[]> {
  const supabase = createServiceClient()
  const flags: ModerationFlag[] = []

  // ── 1. Price range check ──────────────────────────────────
  if (listing.price != null && listing.category_id) {
    try {
      const { data } = await supabase.rpc('category_avg_price', { p_category_id: listing.category_id })
      const avg = Number(data ?? 0)
      if (avg > 0) {
        const ratio = listing.price / avg
        if (ratio < 0.1 || ratio > 5) {
          flags.push({
            check: 'price_range',
            status: 'warn',
            message: `Price $${listing.price.toFixed(2)} is unusual for this category (avg $${avg.toFixed(2)}, ${Math.round(ratio * 100)}% of average).`,
          })
        } else {
          flags.push({ check: 'price_range', status: 'pass', message: 'Price within normal range for category.' })
        }
      } else {
        flags.push({ check: 'price_range', status: 'pass', message: 'No category baseline yet — price accepted.' })
      }
    } catch {
      flags.push({ check: 'price_range', status: 'pass', message: 'Price check skipped.' })
    }
  } else {
    flags.push({ check: 'price_range', status: 'pass', message: 'Price within normal range for category.' })
  }

  // ── 2. Keyword filter ─────────────────────────────────────
  try {
    const { data: keywords } = await supabase.from('prohibited_keywords').select('keyword, category')
    const haystack = `${listing.title} ${listing.description ?? ''}`.toLowerCase()
    const matches = (keywords ?? []).filter((k: any) =>
      haystack.includes(k.keyword.toLowerCase())
    )
    if (matches.length > 0) {
      flags.push({
        check: 'keyword_filter',
        status: 'warn',
        message: `Prohibited keyword(s) detected: ${matches.map((m: any) => `"${m.keyword}" (${m.category})`).join(', ')}.`,
      })
    } else {
      flags.push({ check: 'keyword_filter', status: 'pass', message: 'Description passes keyword filter.' })
    }
  } catch {
    flags.push({ check: 'keyword_filter', status: 'pass', message: 'Keyword filter skipped.' })
  }

  // ── 3. Image count check ──────────────────────────────────
  if (listing.images.length < 2) {
    flags.push({
      check: 'image_count',
      status: 'warn',
      message: `Only ${listing.images.length} image(s) submitted — minimum 2 recommended.`,
    })
  } else {
    flags.push({ check: 'image_count', status: 'pass', message: 'Images pass basic content check.' })
  }

  return flags
}
