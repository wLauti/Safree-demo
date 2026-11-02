import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type PinType = 'hunt' | 'fishing'

interface MapPinProps {
  type?: PinType
  label?: string
  active?: boolean
  className?: string
}

// ── SVG map pin for use as a custom map marker ──────────────
export function MapPin({ type = 'hunt', label, active = false, className }: MapPinProps) {
  const isHunt = type === 'hunt'
  const bg = isHunt ? '#822626' : '#E6DDBC'
  const fg = isHunt ? '#E6DDBC' : '#262525'
  const border = active ? '#E6DDBC' : 'transparent'

  return (
    <div className={cn('flex flex-col items-center group', className)}>
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 transition-transform duration-200',
          active ? 'scale-125' : 'group-hover:scale-110'
        )}
        style={{ backgroundColor: bg, borderColor: border }}
      >
        {isHunt ? (
          // Crosshair icon for hunt
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        ) : (
          // Fish icon for fishing
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 12c.94-3.46 4.94-6 10.5-6 0 3.37-1.42 6.56-3.5 8.5" />
            <path d="M18 17.5c-2.5 2.5-6 3.5-9 3.5-.5-2 1-4.5 3-5.5" />
            <path d="M12 12a3 3 0 1 1-4 4" />
          </svg>
        )}
      </div>
      {/* Stem */}
      <div className="w-0.5 h-2" style={{ backgroundColor: bg }} />
      {/* Dot */}
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bg }} />
      {label && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary text-text-primary text-xs font-body px-2 py-1 rounded whitespace-nowrap shadow border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {label}
        </div>
      )}
    </div>
  )
}
