import { ShieldAlert } from 'lucide-react'

/**
 * Age + compliance disclaimer shown on hunting equipment product pages
 * and experience booking flows.
 */
export function AgeDisclaimer({ className }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 bg-bg-secondary border border-border rounded-card p-3 ${className ?? ''}`}>
      <ShieldAlert className="h-4 w-4 text-accent-cream flex-shrink-0 mt-0.5" />
      <p className="text-xs text-text-muted leading-relaxed">
        By proceeding, you confirm that you are 18 years of age or older and comply with all applicable
        state and federal laws regarding hunting and outdoor activities.
      </p>
    </div>
  )
}
