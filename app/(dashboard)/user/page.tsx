export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'

export const metadata = { title: 'My Account â€” Safree' }

interface Order {
  id: string
  total: number
  status: string
  created_at: string
}

interface Booking {
  id: string
  total: number
  status: string
  start_date: string
  experiences: { title: string } | null
}

export default async function UserDashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const [{ data: ordersData }, { data: bookingsData }] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('bookings').select('id, total, status, start_date, experiences(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

    const orders = (ordersData ?? []) as any as Order[]
    const bookings = (bookingsData ?? []) as any as Booking[]

  const statusVariant = (s: string) => {
    if (['paid', 'confirmed', 'delivered', 'completed'].includes(s)) return 'verified' as const
    if (['disputed', 'cancelled', 'rejected', 'refunded'].includes(s)) return 'pending' as const
    return 'default' as const
  }

  return (
    <PageWrapper>
      <h1 className="text-h2 text-text-primary mb-2">My Account</h1>
      <p className="text-text-muted mb-8">{user.email}</p>
      <Divider />

      <section className="mb-10">
        <h2 className="text-h4 text-text-primary mb-4">Recent Orders</h2>
        {orders.length ? (
          <ul className="space-y-2">
            {orders.map(o => (
              <li key={o.id} className="card-base flex items-center justify-between p-4">
                <div>
                  <p className="text-text-primary font-mono text-sm">#{o.id.slice(0, 8)}</p>
                  <p className="text-text-muted text-sm">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-accent-cream font-heading">{formatCurrency(o.total)}</span>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-text-muted text-sm">No orders yet.</p>}
      </section>

      <section>
        <h2 className="text-h4 text-text-primary mb-4">Recent Bookings</h2>
        {bookings.length ? (
          <ul className="space-y-2">
            {bookings.map(b => (
              <li key={b.id} className="card-base flex items-center justify-between p-4">
                <div>
                  <p className="text-text-primary font-body">{b.experiences?.title ?? 'â€”'}</p>
                  <p className="text-text-muted text-sm">{formatDate(b.start_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-accent-cream font-heading">{formatCurrency(b.total)}</span>
                  <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-text-muted text-sm">No bookings yet.</p>}
      </section>
    </PageWrapper>
  )
}


