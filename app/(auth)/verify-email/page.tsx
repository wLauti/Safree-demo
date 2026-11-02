import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verify Your Email — Safree' }

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="card-base p-10">
        <Mail className="h-16 w-16 text-red-primary mx-auto mb-6" />
        <h1 className="text-h3 text-text-primary mb-3">Check your email</h1>
        <p className="text-text-muted mb-6 leading-relaxed">
          We sent a verification link to your email address. Click the link to activate your account.
        </p>
        <p className="text-text-muted text-sm mb-8">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <Link href="/login" className="text-accent-cream hover:text-red-primary transition-colors underline">
            try signing in again
          </Link>{' '}
          to resend.
        </p>
        <Link href="/">
          <Button variant="ghost" className="w-full">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
