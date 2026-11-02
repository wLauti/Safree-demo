// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getConsent, saveConsent, hasAnalyticsConsent, openCookiePreferences, OPEN_PREFS_EVENT } from '@/lib/consent'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true } as Response)))
})

describe('consent storage', () => {
  it('returns null when nothing stored', () => {
    expect(getConsent()).toBeNull()
  })

  it('saves and reads consent, stamping decidedAt', () => {
    saveConsent({ analytics: true, functional: false })
    const c = getConsent()
    expect(c?.analytics).toBe(true)
    expect(c?.functional).toBe(false)
    expect(c?.decidedAt).toBeTruthy()
  })

  it('persists server-side via fetch /api/consent', () => {
    saveConsent({ analytics: true, functional: true })
    expect(fetch).toHaveBeenCalledWith('/api/consent', expect.objectContaining({ method: 'POST' }))
  })

  it('hasAnalyticsConsent reflects stored value', () => {
    expect(hasAnalyticsConsent()).toBe(false)
    saveConsent({ analytics: true, functional: false })
    expect(hasAnalyticsConsent()).toBe(true)
  })

  it('openCookiePreferences dispatches the reopen event', () => {
    const handler = vi.fn()
    window.addEventListener(OPEN_PREFS_EVENT, handler)
    openCookiePreferences()
    expect(handler).toHaveBeenCalled()
    window.removeEventListener(OPEN_PREFS_EVENT, handler)
  })

  it('returns null gracefully on corrupt storage', () => {
    localStorage.setItem('safree_cookie_consent', '{not json')
    expect(getConsent()).toBeNull()
  })
})
