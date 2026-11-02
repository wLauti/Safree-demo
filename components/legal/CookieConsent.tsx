'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getConsent, saveConsent, OPEN_PREFS_EVENT, type ConsentState } from '@/lib/consent'
import { Cookie } from 'lucide-react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [managing, setManaging] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: true, functional: true })

  useEffect(() => {
    if (!getConsent()) setVisible(true)
    const reopen = () => {
      const current = getConsent()
      if (current) setPrefs({ analytics: current.analytics, functional: current.functional })
      setManaging(true)
      setVisible(true)
    }
    window.addEventListener(OPEN_PREFS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_PREFS_EVENT, reopen)
  }, [])

  const decide = (consent: ConsentState) => {
    saveConsent(consent)
    setVisible(false)
    setManaging(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-bg-secondary border border-border rounded-card shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Cookie className="h-5 w-5 text-accent-cream" />
          <h2 className="font-heading text-lg text-text-primary">Your Privacy Choices</h2>
        </div>

        <p className="text-text-muted text-sm leading-relaxed mb-4">
          Safree uses cookies for analytics and functionality. You can accept all, reject non-essential,
          or manage your preferences. Essential cookies (needed to sign in and check out) are always on.
          See our <Link href="/privacy" className="text-accent-cream hover:underline">Privacy Policy</Link>.
        </p>

        {managing && (
          <div className="space-y-3 mb-4 bg-bg-primary rounded-card p-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Essential <span className="text-text-muted text-xs">(always on)</span></span>
              <input type="checkbox" checked disabled className="accent-red-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-primary">Functional</span>
              <input type="checkbox" checked={prefs.functional} onChange={e => setPrefs(p => ({ ...p, functional: e.target.checked }))} className="accent-red-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-primary">Analytics</span>
              <input type="checkbox" checked={prefs.analytics} onChange={e => setPrefs(p => ({ ...p, analytics: e.target.checked }))} className="accent-red-primary" />
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {managing ? (
            <>
              <Button variant="primary" className="flex-1" onClick={() => decide(prefs)}>Save Preferences</Button>
              <Button variant="ghost" onClick={() => decide({ analytics: false, functional: false })}>Reject Non-Essential</Button>
            </>
          ) : (
            <>
              <Button variant="primary" className="flex-1" onClick={() => decide({ analytics: true, functional: true })}>Accept All</Button>
              <Button variant="secondary" onClick={() => setManaging(true)}>Manage Preferences</Button>
              <Button variant="ghost" onClick={() => decide({ analytics: false, functional: false })}>Reject Non-Essential</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
