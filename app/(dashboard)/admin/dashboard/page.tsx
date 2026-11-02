export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatCard } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { formatCurrency } from '@/lib/utils/formatters'
import { DashboardCharts, type ChartData } from './DashboardCharts'
import { Users, ShoppingBag, AlertTriangle, BadgeCheck, DollarSign, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — Safree' }

interface Props { searchParams: { range?: string } }

export default async function AdminDashboardPage({ searchParams }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const rangeDays = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[searchParams.range ?? '30d'] ?? 30
  const since = new Date(); since.setDate(since.getDate() - rangeDays)
  const sinceISO = since.toISOString()

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)

  // ── Stat cards ────────────────────────────────────────────
  const [
    { count: userCount },
    { count: activeProducts },
    { count: activeExp },
    { count: openDisputes },
    { count: pendingVerif },
    { data: paidOrders },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('stores').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('orders').select('total, paid_at').in('status', ['paid', 'shipped', 'delivered']).gte('paid_at', startOfMonth.toISOString()),
  ])

  const orders = (paidOrders ?? []) as any[]
  const todayRevenue = orders.filter(o => o.paid_at && new Date(o.paid_at) >= startOfToday).reduce((s, o) => s + o.total, 0)
  const monthRevenue = orders.reduce((s, o) => s + o.total, 0)
  const activeListings = (activeProducts ?? 0) + (activeExp ?? 0)

  // ── Chart data ────────────────────────────────────────────
  const [{ data: recentProfiles }, { data: recentOrders }, { data: allProducts }, { data: allExp }, { data: allDisputes }] = await Promise.all([
    supabase.from('profiles').select('created_at, role').gte('created_at', sinceISO),
    supabase.from('orders').select('total, paid_at').in('status', ['paid', 'shipped', 'delivered']).gte('paid_at', sinceISO),
    supabase.from('products').select('status'),
    supabase.from('experiences').select('status'),
    supabase.from('disputes').select('status'),
  ])

  // Build daily buckets
  const dayKeys: string[] = []
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dayKeys.push(d.toISOString().split('T')[0])
  }
  const fmtDay = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const newUsers = dayKeys.map(day => {
    const rows = (recentProfiles ?? []).filter((p: any) => p.created_at?.split('T')[0] === day)
    return {
      date: fmtDay(day),
      user: rows.filter((r: any) => r.role === 'user').length,
      store: rows.filter((r: any) => r.role === 'store').length,
    }
  })

  const transactions = dayKeys.map(day => ({
    date: fmtDay(day),
    amount: (recentOrders ?? []).filter((o: any) => o.paid_at?.split('T')[0] === day).reduce((s: number, o: any) => s + o.total, 0),
  }))

  const countByStatus = (rows: any[], statuses: string[]) =>
    statuses.map(st => ({ name: st, value: rows.filter(r => r.status === st).length })).filter(s => s.value > 0)

  const listingRows = [...(allProducts ?? []), ...(allExp ?? [])]
  const listingsByStatus = countByStatus(listingRows, ['active', 'pending', 'rejected', 'archived'])
  const disputesByStatus = countByStatus((allDisputes ?? []) as any[], ['open', 'under_review', 'resolved_refund', 'resolved_no_refund', 'closed'])

  const chartData: ChartData = {
    newUsers,
    transactions,
    listingsByStatus: listingsByStatus.length ? listingsByStatus : [{ name: 'none', value: 1 }],
    disputesByStatus: disputesByStatus.length ? disputesByStatus : [{ name: 'none', value: 1 }],
  }

  const RANGES = [{ k: '7d', l: '7 days' }, { k: '30d', l: '30 days' }, { k: '90d', l: '90 days' }]
  const activeRange = searchParams.range ?? '30d'

  return (
    <PageWrapper>
      <div className="py-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <h1 className="text-h1 text-text-primary">Admin Dashboard</h1>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <a key={r.k} href={`/admin/dashboard?range=${r.k}`}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${activeRange === r.k ? 'bg-red-primary text-accent-cream' : 'bg-bg-secondary text-text-muted hover:text-text-primary'}`}>
                {r.l}
              </a>
            ))}
          </div>
        </div>
        <p className="text-text-muted mb-6">Platform-wide overview</p>
        <Divider />

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 my-6">
          <StatCard label="Total Users" value={userCount ?? 0} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active Listings" value={activeListings} icon={<ShoppingBag className="h-5 w-5" />} />
          <StatCard label="Open Disputes" value={openDisputes ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
          <StatCard label="Pending Verif." value={pendingVerif ?? 0} icon={<BadgeCheck className="h-5 w-5" />} />
          <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="Month Revenue" value={formatCurrency(monthRevenue)} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <DashboardCharts data={chartData} />
      </div>
    </PageWrapper>
  )
}
