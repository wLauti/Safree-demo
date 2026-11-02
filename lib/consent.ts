// Cookie consent storage + analytics gating (client-side).

export interface ConsentState {
  analytics: boolean
  functional: boolean
  decidedAt?: string
}

const KEY = 'safree_cookie_consent'

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as ConsentState : null
  } catch {
    return null
  }
}

export function saveConsent(consent: ConsentState): void {
  if (typeof window === 'undefined') return
  const withTime = { ...consent, decidedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(withTime))
  // Persist server-side for logged-in users (best effort)
  fetch('/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analytics: consent.analytics, functional: consent.functional }),
  }).catch(() => {})
  // Let listeners (e.g. analytics loader) react
  window.dispatchEvent(new CustomEvent('safree:consent', { detail: withTime }))
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true
}

export const OPEN_PREFS_EVENT = 'safree:open-cookie-prefs'

/** Footer "Manage Cookie Preferences" dispatches this to reopen the banner. */
export function openCookiePreferences(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_PREFS_EVENT))
}
