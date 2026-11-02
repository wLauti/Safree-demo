import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export function LegalPage({
  title, lastUpdated, draft, children,
}: {
  title: string
  lastUpdated: string
  draft?: boolean
  children: ReactNode
}) {
  return (
    <PageWrapper>
      <div className="py-8 max-w-3xl mx-auto">
        <h1 className="text-h1 text-text-primary mb-2">{title}</h1>
        <p className="text-text-muted text-sm mb-6">Last updated: {lastUpdated}</p>

        {draft && (
          <div className="flex items-start gap-2 bg-yellow-900/30 border border-yellow-700 rounded-card p-4 mb-6">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-200 text-sm font-body">
              <strong>DRAFT — Requires legal review before publication.</strong> This document was generated
              as a starting point and has not been reviewed by counsel. Do not rely on it as legal advice.
            </p>
          </div>
        )}

        <Divider />
        <div className="legal-content mt-6 space-y-6 text-text-muted text-sm leading-relaxed [&_h2]:font-heading [&_h2]:text-text-primary [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:text-text-primary [&_h3]:font-body [&_h3]:font-medium [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-accent-cream [&_a]:underline [&_strong]:text-text-primary">
          {children}
        </div>
      </div>
    </PageWrapper>
  )
}
