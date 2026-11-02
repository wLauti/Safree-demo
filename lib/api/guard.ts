// Shared API route guards + error handling.
// Every /api/* route should validate the session server-side and never trust
// client-sent role claims. Errors are made generic in production.
import { NextResponse } from 'next/server'
import { z, type ZodSchema } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

const IS_PROD = process.env.NODE_ENV === 'production'

/** Thrown inside route handlers; converted to a JSON response by `handleRoute`. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface AuthedContext {
  userId: string
  role: UserRole
  email: string
}

/**
 * Require an authenticated session. Throws ApiError(401) if missing.
 * Reads the role from the DB (never from a client-sent claim).
 */
export async function requireUser(): Promise<AuthedContext> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, 'Authentication required')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, status')
    .eq('id', user.id)
    .single()

  const p = profile as any
  if (!p) throw new ApiError(401, 'Authentication required')
  if (p.status === 'suspended' || p.status === 'banned') {
    throw new ApiError(403, 'Account access restricted')
  }

  return { userId: user.id, role: p.role, email: p.email }
}

/** Require one of the given roles. Throws 401 if unauth, 403 if wrong role. */
export async function requireApiRole(roles: UserRole[]): Promise<AuthedContext> {
  const ctx = await requireUser()
  if (!roles.includes(ctx.role)) throw new ApiError(403, 'Insufficient permissions')
  return ctx
}

/** Parse + validate a JSON body against a Zod schema. Throws ApiError(400) on failure. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError(400, 'Invalid JSON body')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    throw new ApiError(400, first ? `${first.path.join('.')}: ${first.message}` : 'Invalid request')
  }
  return result.data
}

/**
 * Wrap a route handler so thrown ApiErrors become clean JSON responses and
 * unexpected errors never leak stack traces in production.
 */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    // Unexpected — log server-side, return generic message
    console.error('[api] Unhandled route error:', err)
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(err)
    } catch {}
    return NextResponse.json(
      { error: IS_PROD ? 'An unexpected error occurred' : String((err as Error)?.message ?? err) },
      { status: 500 }
    )
  }
}

export { z }
