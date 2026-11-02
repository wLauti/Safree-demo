'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

export function MFAEnroll() {
  const supabase = createClient()
  const [enrolled, setEnrolled] = useState<boolean | null>(null)
  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Check current enrollment status
  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.some(f => f.status === 'verified')
      setEnrolled(!!verified)
    }).catch(() => setEnrolled(false))
  }, [supabase])

  const startEnroll = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Safree Admin TOTP' })
    setLoading(false)
    if (error) { notify.error(error.message); return }
    setFactorId(data.id)
    setQr(data.totp.qr_code)
    setSecret(data.totp.secret)
  }

  const verify = async () => {
    if (!factorId || code.length < 6) return
    setLoading(true)
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
    if (cErr) { setLoading(false); notify.error(cErr.message); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    setLoading(false)
    if (error) { notify.error('Invalid code — try again'); return }
    notify.success('Two-factor authentication enabled')
    setEnrolled(true)
    setQr(''); setSecret(''); setCode('')
  }

  if (enrolled === null) {
    return <div className="card-base p-5 text-text-muted text-sm">Checking 2FA status…</div>
  }

  if (enrolled) {
    return (
      <div className="card-base p-5 border-green-700/40">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-green-400" />
          <h3 className="font-heading text-text-primary">Two-Factor Authentication Enabled</h3>
        </div>
        <p className="text-text-muted text-sm">Your admin account is protected with TOTP 2FA.</p>
      </div>
    )
  }

  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-5 w-5 text-yellow-400" />
        <h3 className="font-heading text-text-primary">Enable Two-Factor Authentication</h3>
      </div>
      <p className="text-text-muted text-sm mb-4">
        2FA is required for admin accounts. Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code.
      </p>

      {!qr ? (
        <Button variant="primary" loading={loading} onClick={startEnroll}>Begin Setup</Button>
      ) : (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="TOTP QR code" className="w-44 h-44 bg-white rounded-card p-2" />
          <p className="text-text-muted text-xs">
            Can&apos;t scan? Enter this secret manually: <code className="text-accent-cream break-all">{secret}</code>
          </p>
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            className="input-base w-40 text-center text-lg tracking-widest font-mono"
          />
          <div>
            <Button variant="primary" loading={loading} disabled={code.length < 6} onClick={verify}>
              Verify &amp; Enable
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
