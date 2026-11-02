export const dynamic = 'force-dynamic'
import { RegisterForm } from '@/components/forms/RegisterForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Account — Safree' }

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-h2 text-text-primary mb-2 text-center">Join Safree</h1>
      <p className="text-text-muted text-center mb-8">Create your free account to get started</p>
      <RegisterForm />
    </div>
  )
}
