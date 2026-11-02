'use client'

import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { usePush } from '@/hooks/usePush'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { Bell, BellRing } from 'lucide-react'

export function NotificationsClient() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { status, subscribe } = usePush()

  const routeFor = (n: any): string => {
    if (n.ref_type === 'order' && n.ref_id) return `/user/orders/${n.ref_id}`
    if (n.ref_type === 'booking' && n.ref_id) return `/booking/confirmation/${n.ref_id}`
    if (n.ref_type === 'dispute') return '/user/disputes'
    if (n.ref_type === 'store') return '/store'
    return '#'
  }

  const onClick = async (n: any) => {
    if (!n.is_read) await markRead(n.id)
    const r = routeFor(n)
    if (r !== '#') router.push(r)
  }

  return (
    <>
      {/* Push opt-in */}
      {status !== 'subscribed' && (
        <div className="card-base p-4 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-accent-cream" />
            <div>
              <p className="text-text-primary text-sm font-body">Enable push notifications</p>
              <p className="text-text-muted text-xs">Get instant alerts for orders, bookings, and disputes.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={subscribe} loading={status === 'subscribing'}
            disabled={status === 'unsupported' || status === 'denied'}>
            {status === 'denied' ? 'Blocked' : status === 'unsupported' ? 'Unsupported' : 'Enable'}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-text-muted text-sm">{unreadCount} unread</p>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()} className="text-sm text-accent-cream hover:underline">Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12">
          <EmptyState icon={<Bell />} title="No notifications" description="You're all caught up." />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => onClick(n)}
              className={cn('w-full text-left card-base p-4 flex gap-3 hover:border-red-primary/40 transition-colors', !n.is_read && 'bg-red-primary/5')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-body">{n.title}</p>
                {n.body && <p className="text-text-muted text-sm mt-0.5">{n.body}</p>}
                <p className="text-text-muted text-xs mt-1">{formatRelativeDate(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-primary flex-shrink-0 mt-1.5" />}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
