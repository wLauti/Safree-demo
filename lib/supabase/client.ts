'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton: reuse the same client instance across all components in the browser.
// Multiple instances using cookies (not localStorage) don't share auth state events,
// which causes the Navbar and other components to miss session changes after login.
let client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}


