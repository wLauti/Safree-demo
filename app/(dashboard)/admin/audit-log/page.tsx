export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log — Safree' }

const PAGE_SIZE = 50

interface Props { searchParams: { page?: string; action?: string } }

export default async function AuditLogPage({ searchParams }: Props) {
  await requireRole(['admin'])
  const supabase = createServiceClient()

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('audit_log')
    .select('id, actor_id, actor_role, action, target_type, target_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.action) query = query.eq('action', searchParams.action)

  const { data: logsRaw, count } = await query
  const logs = (logsRaw ?? []) as any[]

  // Resolve actor names
  const actorIds = Array.from(new Set(logs.map(l => l.actor_id).filter(Boolean)))
  const { data: actors } = actorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] }
  const actorMap = new Map(((actors ?? []) as any[]).map(a => [a.id, a]))

  return (
    <PageWrapper>
      <div className="py-6">
        <h1 className="text-h1 text-text-primary mb-1">Audit Log</h1>
        <p className="text-text-muted mb-6">{count ?? 0} entries · read-only, immutable</p>
        <Divider />

        <div className="overflow-x-auto rounded-card border border-border mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="text-left px-4 py-3 text-text-muted font-body">Timestamp</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Actor</th>
                <th className="text-left px-4 py-3 text-text-muted font-body">Action</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden md:table-cell">Target</th>
                <th className="text-left px-4 py-3 text-text-muted font-body hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-text-muted">No audit entries.</td></tr>
              ) : logs.map(log => {
                const actor = actorMap.get(log.actor_id)
                return (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/40 transition-colors align-top">
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary">{actor?.full_name ?? 'System'}</span>
                      <Badge variant="default" className="ml-1">{log.actor_role}</Badge>
                    </td>
                    <td className="px-4 py-3"><span className="font-mono text-xs text-accent-cream">{log.action}</span></td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">
                      {log.target_type}{log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell max-w-[240px]">
                      {log.metadata ? <code className="text-[11px] break-all">{JSON.stringify(log.metadata)}</code> : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center">
          <Pagination total={count ?? 0} perPage={PAGE_SIZE} currentPage={page} />
        </div>
      </div>
    </PageWrapper>
  )
}
