'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/utils/validators'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { notify } from '@/components/ui/Notification'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { IS_DEMO, DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demo'

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  const demoLogin = async (email: string) => {
    setDemoLoading(email)
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
    if (error) { notify.error(error.message); setDemoLoading(null); return }
    const next = searchParams.get('next') ?? '/'
    window.location.href = next
  }

  const onSubmit = async (data: LoginInput) => {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      notify.error(error.message)
      return
    }
    // Hard navigation ensures the browser re-fetches the page with the new
    // session cookies, so all server components and useAuth hooks reinitialize.
    const next = searchParams.get('next') ?? '/'
    window.location.href = next
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      notify.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="card-base p-8">
      {/* DEMO: one-click sign-in with the pre-seeded test accounts */}
      {IS_DEMO && (
        <div className="mb-6">
          <p className="text-label text-red-primary mb-3 text-center tracking-widest">
            Modo demo · entrar con una cuenta de prueba
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.email}
                type="button"
                onClick={() => demoLogin(a.email)}
                disabled={!!demoLoading}
                className="w-full flex items-center justify-between bg-bg-primary border border-border rounded-card px-4 py-2.5 text-left hover:border-red-primary/60 transition-colors disabled:opacity-50"
              >
                <span className="text-text-primary text-sm font-body font-medium">
                  {a.label}
                  {demoLoading === a.email && <span className="text-text-muted"> · entrando…</span>}
                </span>
                <span className="text-text-muted text-xs">{a.desc}</span>
              </button>
            ))}
          </div>
          <Divider label="o entrar manualmente" />
        </div>
      )}

      {/* Google OAuth */}
      <Button
        variant="secondary"
        className="w-full mb-4"
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        type="button"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      <Divider label="or sign in with email" />

      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-sm text-text-muted hover:text-accent-cream transition-colors">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-accent-cream hover:text-red-primary transition-colors">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
