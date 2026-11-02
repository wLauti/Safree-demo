import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ShieldX } from 'lucide-react'

export const metadata = { title: 'Unauthorized — Safree' }

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="card-base p-12 max-w-md w-full text-center">
        <ShieldX className="h-16 w-16 text-red-primary mx-auto mb-6" />
        <h1 className="text-h2 text-text-primary mb-3">Access Denied</h1>
        <p className="text-text-muted mb-8">You don&apos;t have permission to view this page.</p>
        <div className="flex flex-col gap-3">
          <Link href="/"><Button variant="primary" className="w-full">Go to Homepage</Button></Link>
          <Link href="/login"><Button variant="ghost" className="w-full">Sign In with a Different Account</Button></Link>
        </div>
      </div>
    </div>
  )
}
