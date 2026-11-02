import { Badge } from '@/components/ui/Badge'

const LABELS: Record<string, { label: string; variant: 'verified' | 'pending' | 'new' | 'default' }> = {
  open: { label: 'Open', variant: 'pending' },
  under_review: { label: 'Under Review', variant: 'new' },
  resolved_refund: { label: 'Resolved · Refund', variant: 'verified' },
  resolved_no_refund: { label: 'Resolved · No Refund', variant: 'default' },
  closed: { label: 'Closed', variant: 'default' },
}

export function DisputeStatusBadge({ status }: { status: string }) {
  const s = LABELS[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
