export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Calendar, CheckCircle } from 'lucide-react'
import { CompleteBookingButton } from './CompleteBookingButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bookings — Safree' }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (['confirmed', 'completed'].includes(s)) return 'verified'
  if (['cancelled', 'disputed'].includes(s)) return 'pending'
  return 'default'
}

interface Props { searchParams: { status?: string } }

export default async function StoreBookingsPage({ searchParams }: Props) {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', profile.id).single()
  const s = store as any

  if (!s) return (
    <PageWrapper><div className="text-center py-20"><p className="text-text-muted">Store not found.</p></div></PageWrapper>
  )

  const statusFilter = searchParams.status

  let query = supabase
    .from('bookings')
    .select(`
      id, ref_number, status, start_date, end_date, guests,
      subtotal, addons_total, service_fee, total, addons, funds_released, paid_at,
      experiences(id, title, slug)
    `)
    .eq('store_id', s.id)
    .order('start_date', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  const { data: bookingsRaw } = await query
  const bookings = (bookingsRaw ?? []) as any[]

  // Revenue summary
  const { data: revenueRaw } = await supabase
    .from('bookings')
    .select('total, service_fee, paid_at, funds_released')
    .eq('store_id', s.id)
    .in('status', ['confirmed', 'completed'])
  const revenue = (revenueRaw ?? []) as any[]

  const totalConfirmed = revenue.filter(r => !r.funds_released).reduce((sum, r) => sum + (r.total - r.service_fee), 0)
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const monthReleased = revenue
    .filter(r => r.funds_released && r.paid_at && new Date(r.paid_at) >= thisMonth)
    .reduce((sum, r) => sum + (r.total - r.service_fee), 0)
  const allTimeTotal = revenue.reduce((sum, r) => sum + (r.total - r.service_fee), 0)

  const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Bookings</h1>
        <p className="text-text-muted mb-6">{s.name}</p>

        {/* Revenue summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card-base p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Pending Release</p>
            <p className="font-heading text-2xl text-accent-cream">{formatCurrency(totalConfirmed)}</p>
            <p className="text-text-muted text-xs mt-1">after Safree fee</p>
          </div>
          <div className="card-base p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Released This Month</p>
            <p className="font-heading text-2xl text-accent-cream">{formatCurrency(monthReleased)}</p>
            <p className="text-text-muted text-xs mt-1">transferred to Stripe</p>
          </div>
          <div className="card-base p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">All Time</p>
            <p className="font-heading text-2xl text-accent-cream">{formatCurrency(allTimeTotal)}</p>
            <p className="text-text-muted text-xs mt-1">net earnings</p>
          </div>
        </div>

        <Divider />

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap my-5">
          {STATUSES.map(st => (
            <a
              key={st}
              href={st === 'all' ? '/store/bookings' : `/store/bookings?status=${st}`}
              className={`px-3 py-1 rounded-full text-xs font-body capitalize transition-colors ${
                (statusFilter ?? 'all') === st
                  ? 'bg-red-primary text-accent-cream'
                  : 'bg-bg-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              {st}
            </a>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="py-12">
            <EmptyState icon={<Calendar />} title="No bookings" description="Bookings will appear here once hunters start reserving your experiences." />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="text-left px-4 py-3 text-text-muted font-body">Ref</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Experience</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body">Dates</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body hidden sm:table-cell">Hunters</th>
                  <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body">Net</th>
                  <th className="text-right px-4 py-3 text-text-muted font-body">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const net = b.total - b.service_fee
                  return (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-text-muted text-xs">
                        #{b.ref_number ?? b.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-text-primary hidden md:table-cell max-w-[160px]">
                        <p className="line-clamp-1 text-xs">{b.experiences?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {new Date(b.start_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(b.end_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden sm:table-cell text-center">{b.guests}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                        {b.funds_released && <span className="text-[10px] text-green-400 ml-1">✓ Released</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-accent-cream">{formatCurrency(net)}</td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'confirmed' && <CompleteBookingButton bookingId={b.id} />}
                        {b.status !== 'confirmed' && <span className="text-text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
