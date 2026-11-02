'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import {
  Bell, ShoppingBag, Calendar, Scale, Star, DollarSign,
  CheckCircle, ShieldCheck, AlertTriangle,
} from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  new_order: ShoppingBag, order_paid: ShoppingBag, payment_failed: AlertTriangle,
  new_booking: Calendar, booking_cancelled: Calendar, booking_completed: Calendar,
  funds_released: DollarSign, dispute_opened: Scale, dispute_resolved: Scale,
  dispute_response: Scale, review_received: Star,
  listing_approved: CheckCircle, listing_rejected: AlertTriangle,
  verification_approved: ShieldCheck, account_suspended: AlertTriangle,
}

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const routeFor = (n: { ref_type: string | null; ref_id: string | null; type: string }): string => {
    if (n.ref_type === 'order' && n.ref_id) return `/user/orders/${n.ref_id}`
    if (n.ref_type === 'booking' && n.ref_id) return `/booking/confirmation/${n.ref_id}`
    if (n.ref_type === 'dispute') return '/user/disputes'
    if (n.ref_type === 'store') return '/store'
    if (n.type.startsWith('listing')) return '/store/listings'
    return '/user/notifications'
  }

  const onClick = async (n: any) => {
    if (!n.is_read) await markRead(n.id)
    setOpen(false)
    router.push(routeFor(n))
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative text-text-muted hover:text-text-primary transition-colors p-1" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-primary text-accent-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-bg-secondary border border-border rounded-card shadow-card overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-heading text-text-primary text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="text-xs text-accent-cream hover:underline">Mark all read</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No notifications yet.</p>
            ) : notifications.slice(0, 20).map(n => {
              const Icon = ICONS[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  onClick={() => onClick(n)}
                  className={cn('w-full text-left px-4 py-3 flex gap-3 hover:bg-bg-primary transition-colors border-b border-border/50 last:border-0', !n.is_read && 'bg-red-primary/5')}
                >
                  <div className="mt-0.5 text-text-muted flex-shrink-0"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-body line-clamp-1">{n.title}</p>
                    {n.body && <p className="text-text-muted text-xs line-clamp-2">{n.body}</p>}
                    <p className="text-text-muted text-[10px] mt-0.5">{formatRelativeDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-primary flex-shrink-0 mt-1.5" />}
                </button>
              )
            })}
          </div>

          <Link href="/user/notifications" onClick={() => setOpen(false)} className="block text-center py-2.5 text-xs text-accent-cream hover:bg-bg-primary transition-colors border-t border-border">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
