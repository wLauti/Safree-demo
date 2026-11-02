'use client'

import { openCookiePreferences } from '@/lib/consent'

export function CookiePrefsButton() {
  return (
    <button
      onClick={openCookiePreferences}
      className="text-text-muted text-sm hover:text-accent-cream transition-colors text-left"
    >
      Manage Cookie Preferences
    </button>
  )
}
