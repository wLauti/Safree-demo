export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { LoginForm } from '@/components/forms/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In — Safree' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-h2 text-text-primary mb-2 text-center">Welcome back</h1>
      <p className="text-text-muted text-center mb-8">Sign in to your Safree account</p>
      <Suspense fallback={<div className="card-base p-8 animate-pulse h-64" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
