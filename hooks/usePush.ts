'use client'

import { useState, useCallback } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/**
 * Hook to register the service worker and subscribe to Web Push.
 * Call `subscribe()` AFTER a user completes a meaningful action — never on landing.
 */
export function usePush() {
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported'>('idle')

  const subscribe = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return false
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) { setStatus('unsupported'); return false }

    try {
      setStatus('subscribing')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return false }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        })
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      })
      if (res.ok) { setStatus('subscribed'); return true }
      return false
    } catch (err) {
      console.error('[push] subscribe failed:', err)
      setStatus('idle')
      return false
    }
  }, [])

  return { status, subscribe }
}
