export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { CheckCircle, AlertTriangle, XCircle, ExternalLink, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payment Settings — Safree' }

export default async function StorePaymentsPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: storeRaw } = await supabase
    .from('stores')
    .select('id, name, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
    .eq('owner_id', profile.id)
    .single()
  const store = storeRaw as any

  if (!store) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-text-muted">Store not found.</p>
        </div>
      </PageWrapper>
    )
  }

  // Fetch Stripe balance and payouts if onboarded
  let balance: { available: number; pending: number } | null = null
  let recentPayouts: any[] = []

  if (store.stripe_account_id && store.stripe_onboarding_complete) {
    try {
      const [stripeBalance, stripePayouts] = await Promise.all([
        stripe.balance.retrieve({ stripeAccount: store.stripe_account_id }),
        stripe.payouts.list({ limit: 10 }, { stripeAccount: store.stripe_account_id }),
      ])
      balance = {
        available: stripeBalance.available.reduce((s: number, b: any) => s + b.amount, 0) / 100,
        pending: stripeBalance.pending.reduce((s: number, b: any) => s + b.amount, 0) / 100,
      }
      recentPayouts = stripePayouts.data
    } catch {}
  }

  const statusInfo = store.stripe_charges_enabled
    ? { icon: <CheckCircle className="h-5 w-5 text-green-400" />, label: 'Connected', variant: 'verified' as const, desc: 'Payments enabled · Payouts active' }
    : store.stripe_account_id
    ? { icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />, label: 'Setup Incomplete', variant: 'pending' as const, desc: 'Complete onboarding to start receiving payments' }
    : { icon: <XCircle className="h-5 w-5 text-red-primary" />, label: 'Not Connected', variant: 'pending' as const, desc: 'Set up payments to start selling' }

  return (
    <PageWrapper>
      <div className="py-6 max-w-2xl">
        <h1 className="text-h1 text-text-primary mb-1">Payment Settings</h1>
        <p className="text-text-muted mb-6">{store.name}</p>
        <Divider />

        {/* Connection status */}
        <section className="mt-8 mb-8">
          <h2 className="font-heading text-lg text-text-primary mb-4">Stripe Connect</h2>
          <div className="card-base p-5">
            <div className="flex items-center gap-3 mb-3">
              {statusInfo.icon}
              <div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <p className="text-text-muted text-sm mt-1">{statusInfo.desc}</p>
              </div>
            </div>

            {!store.stripe_charges_enabled ? (
              <SetupPaymentsButton hasAccount={!!store.stripe_account_id} />
            ) : (
              <div className="flex gap-2 mt-3">
                <p className="text-xs text-text-muted">
                  Account: <span className="font-mono text-text-primary">{store.stripe_account_id}</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Balance */}
        {balance && (
          <>
            <Divider />
            <section className="my-8">
              <h2 className="font-heading text-lg text-text-primary mb-4">Stripe Balance</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card-base p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-text-muted text-xs mb-1">
                    <DollarSign className="h-3.5 w-3.5" /> Available
                  </div>
                  <p className="font-heading text-2xl text-accent-cream">{formatCurrency(balance.available)}</p>
                </div>
                <div className="card-base p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-text-muted text-xs mb-1">
                    <Clock className="h-3.5 w-3.5" /> Pending
                  </div>
                  <p className="font-heading text-2xl text-text-primary">{formatCurrency(balance.pending)}</p>
                </div>
              </div>

              {recentPayouts.length > 0 && (
                <>
                  <h3 className="font-heading text-base text-text-primary mb-3">Recent Payouts</h3>
                  <div className="space-y-2">
                    {recentPayouts.map((payout: any) => (
                      <div key={payout.id} className="card-base flex items-center justify-between p-3 text-sm">
                        <div>
                          <p className="text-text-primary font-body capitalize">{payout.status}</p>
                          <p className="text-text-muted text-xs">
                            {new Date(payout.arrival_date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="font-heading text-accent-cream">{formatCurrency(payout.amount / 100)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4">
                <a
                  href={`https://dashboard.stripe.com/${store.stripe_account_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent-cream hover:underline"
                >
                  View full Stripe dashboard <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </>
        )}
      </div>
    </PageWrapper>
  )
}

function SetupPaymentsButton({ hasAccount }: { hasAccount: boolean }) {
  return (
    <form action="/api/store/onboarding" method="POST" className="mt-3">
      <button
        type="submit"
        className="btn-primary text-sm"
        onClick={async (e) => {
          e.preventDefault()
          const res = await fetch('/api/store/onboarding', { method: 'POST' })
          const { url } = await res.json()
          if (url) window.location.href = url
        }}
      >
        {hasAccount ? 'Continue Setup' : 'Set Up Payments'}
      </button>
    </form>
  )
}
