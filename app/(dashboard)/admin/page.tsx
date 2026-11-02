import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatCard } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Users, ShoppingBag, MapPin, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Dashboard — Safree' }

export default async function AdminPage() {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const [
    { count: userCount },
    { count: productCount },
    { count: experienceCount },
    { count: disputeCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('experiences').select('*', { count: 'exact', head: true }),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  return (
    <PageWrapper>
      <h1 className="text-h2 text-text-primary mb-2">Admin Dashboard</h1>
      <p className="text-text-muted mb-8">Platform-wide overview</p>
      <Divider />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={userCount ?? 0} icon={<Users className="h-6 w-6" />} />
        <StatCard label="Products" value={productCount ?? 0} icon={<ShoppingBag className="h-6 w-6" />} />
        <StatCard label="Experiences" value={experienceCount ?? 0} icon={<MapPin className="h-6 w-6" />} />
        <StatCard label="Open Disputes" value={disputeCount ?? 0} icon={<AlertTriangle className="h-6 w-6" />} />
      </div>
    </PageWrapper>
  )
}
