export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ListingRowActions } from './ListingRowActions'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Listings Management — Safree' }

interface Props { searchParams: { type?: string; status?: string } }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (s === 'active') return 'verified'
  if (s === 'pending') return 'pending'
  return 'default'
}

export default async function AdminListingsPage({ searchParams }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const typeFilter = searchParams.type ?? 'all'
  const statusFilter = searchParams.status ?? ''

  const buildSelect = (table: string, priceCol: string) => {
    let q = supabase
      .from(table)
      .select(`id, slug, title, status, featured, ${priceCol}, images, created_at, stores(name)`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (statusFilter) q = q.eq('status', statusFilter)
    return q
  }

  const [{ data: products }, { data: experiences }] = await Promise.all([
    typeFilter === 'experience' ? Promise.resolve({ data: [] }) : buildSelect('products', 'price'),
    typeFilter === 'product' ? Promise.resolve({ data: [] }) : buildSelect('experiences', 'price_per_person'),
  ])

  const rows = [
    ...((products ?? []) as any[]).map(p => ({ ...p, _type: 'product' as const, _price: p.price })),
    ...((experiences ?? []) as any[]).map(e => ({ ...e, _type: 'experience' as const, _price: e.price_per_person })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const TYPES = [{ k: 'all', l: 'All' }, { k: 'product', l: 'Products' }, { k: 'experience', l: 'Experiences' }]
  const STATUSES = ['', 'active', 'pending', 'rejected', 'archived']

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Listings Management</h1>
        <p className="text-text-muted mb-6">{rows.length} listings</p>
        <Divider />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 my-6 items-center">
          <div className="flex gap-1">
            {TYPES.map(t => (
              <a key={t.k} href={`/admin/listings?type=${t.k}${statusFilter ? `&status=${statusFilter}` : ''}`}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${typeFilter === t.k ? 'bg-red-primary text-accent-cream' : 'bg-bg-secondary text-text-muted hover:text-text-primary'}`}>
                {t.l}
              </a>
            ))}
          </div>
          <div className="flex gap-1">
            {STATUSES.map(st => (
              <a key={st} href={`/admin/listings?type=${typeFilter}${st ? `&status=${st}` : ''}`}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${statusFilter === st ? 'bg-accent-cream text-bg-primary' : 'bg-bg-secondary text-text-muted hover:text-text-primary'}`}>
                {st || 'Any status'}
              </a>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="text-left px-4 py-3 text-text-muted font-body">Listing</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden sm:table-cell">Store</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Type</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Status</th>
                <th className="text-right px-4 py-3 text-text-muted font-body">Price</th>
                <th className="text-right px-4 py-3 text-text-muted font-body">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">No listings.</td></tr>
              ) : rows.map(row => (
                <tr key={`${row._type}-${row.id}`} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-secondary flex-shrink-0">
                        {row.images?.[0] && <Image src={row.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                      </div>
                      <span className="text-text-primary line-clamp-1 max-w-[200px]">{row.title}</span>
                      {row.featured && <Badge variant="sale">★</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{row.stores?.name}</td>
                  <td className="px-4 py-3"><Badge variant={row._type === 'experience' ? 'new' : 'default'}>{row._type}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-4 py-3 text-right text-accent-cream font-heading">{formatCurrency(row._price)}</td>
                  <td className="px-4 py-3">
                    <ListingRowActions type={row._type} id={row.id} featured={row.featured} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
