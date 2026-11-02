import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Simple in-memory rate limiter (per edge instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

function getRateLimitConfig(pathname: string): { max: number; window: number } {
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return { max: 10, window: 60_000 }
  }
  if (pathname.startsWith('/api/checkout') || pathname.startsWith('/api/stripe')) {
    return { max: 5, window: 60_000 }
  }
  return { max: 60, window: 60_000 }
}

function applyCORS(response: NextResponse, request: NextRequest): NextResponse {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const origin = request.headers.get('origin')

  if (origin && origin !== allowedOrigin) {
    // Block cross-origin API requests
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  if (origin === allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 })
  }

  // Rate limiting
  const { max, window } = getRateLimitConfig(pathname)
  if (!rateLimit(`${ip}:${pathname.split('/').slice(0, 3).join('/')}`, max, window)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  // Supabase session refresh
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Role-based route protection
  const protectedRoutes: Record<string, string[]> = {
    '/admin': ['admin'],
    '/moderator': ['admin', 'moderator'],
    '/store': ['admin', 'store'],
    '/user': ['admin', 'moderator', 'store', 'user'],
  }

  for (const [prefix, allowedRoles] of Object.entries(protectedRoutes)) {
    // Match the prefix only at a path boundary so e.g. the public `/stores/[slug]`
    // profile page is not caught by the `/store` dashboard guard.
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return applyCORS(supabaseResponse, request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
