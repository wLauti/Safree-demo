import type { UserRole } from './supabase/types'

interface AuditEventParams {
  actor_id: string
  actor_role: UserRole
  action: string
  target_type: string
  target_id?: string
  metadata?: Record<string, unknown>
}

/**
 * Write an immutable audit trail entry via service role only.
 * Never call from client-side code â€” route through a Server Action or API route.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  const { createServiceClient } = await import('./supabase/server')
  const supabase = createServiceClient()

  const { error } = await supabase.from('audit_log').insert({
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    action: params.action,
    target_type: params.target_type,
    target_id: params.target_id ?? null,
    metadata: params.metadata ?? null,
    } as any)

  if (error) {
    console.error('[audit] Failed to write audit log:', error.message)
  }
}


