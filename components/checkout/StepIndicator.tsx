import { cn } from '@/lib/utils/cn'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  steps: string[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading transition-colors',
                  done
                    ? 'bg-red-primary text-accent-cream'
                    : active
                    ? 'bg-accent-cream text-bg-primary'
                    : 'bg-bg-secondary text-text-muted border border-border'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] font-body hidden sm:block whitespace-nowrap',
                  active ? 'text-accent-cream' : done ? 'text-text-muted' : 'text-text-muted'
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                'h-px w-8 sm:w-16 mx-1 mb-4',
                idx < current ? 'bg-red-primary' : 'bg-border'
              )} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
