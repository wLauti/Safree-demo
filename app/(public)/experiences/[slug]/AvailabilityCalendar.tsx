'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AvailRow {
  date: string
  slots: number
  slots_booked: number
  is_blocked: boolean
}

interface Props {
  experienceSlug: string
  minBookingDays: number
  onRangeSelect?: (start: string, end: string) => void
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay() // 0=Sun
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function AvailabilityCalendar({ experienceSlug, minBookingDays, onRangeSelect }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-based
  const [availability, setAvailability] = useState<AvailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [hovering, setHovering] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/experiences/${experienceSlug}/availability?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(({ availability }) => {
        setAvailability(availability ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [experienceSlug, year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const availMap = new Map(availability.map(a => [a.date, a]))
  const days = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month) // 0=Sun

  const getStatus = (iso: string): 'available' | 'booked' | 'blocked' | 'past' => {
    if (iso < today.toISOString().split('T')[0]) return 'past'
    const row = availMap.get(iso)
    if (!row) return 'available' // no row = open
    if (row.is_blocked) return 'blocked'
    if (row.slots_booked >= row.slots && row.slots > 0) return 'booked'
    return 'available'
  }

  const getSlotsLeft = (iso: string): number | null => {
    const row = availMap.get(iso)
    if (!row || row.is_blocked) return null
    if (row.slots === 0) return null
    return Math.max(0, row.slots - row.slots_booked)
  }

  const handleDayClick = (iso: string) => {
    const status = getStatus(iso)
    if (status === 'past' || status === 'booked' || status === 'blocked') return

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso)
      setRangeEnd(null)
    } else {
      const end = iso < rangeStart ? rangeStart : iso
      const start = iso < rangeStart ? iso : rangeStart
      setRangeStart(start)
      setRangeEnd(end)
      onRangeSelect?.(start, end)
    }
  }

  const isInRange = (iso: string) => {
    const end = rangeEnd ?? hovering
    if (!rangeStart || !end) return false
    const [s, e] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart]
    return iso >= s && iso <= e
  }

  const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div className="card-base p-5">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-heading text-text-primary">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <button onClick={nextMonth} className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-text-muted pb-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-red-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells before month starts */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const iso = toISO(year, month, day)
            const status = getStatus(iso)
            const slotsLeft = getSlotsLeft(iso)
            const inRange = isInRange(iso)
            const isStart = rangeStart === iso
            const isEnd = rangeEnd === iso

            return (
              <button
                key={iso}
                onClick={() => handleDayClick(iso)}
                onMouseEnter={() => rangeStart && !rangeEnd && setHovering(iso)}
                onMouseLeave={() => setHovering(null)}
                disabled={status === 'past' || status === 'booked' || status === 'blocked'}
                className={cn(
                  'relative flex flex-col items-center justify-center h-10 rounded text-xs transition-colors',
                  status === 'past' && 'text-text-muted/40 cursor-default',
                  status === 'available' && !inRange && 'text-text-primary hover:bg-red-primary/20 cursor-pointer',
                  status === 'booked' && 'text-red-primary/50 cursor-not-allowed bg-red-primary/5',
                  status === 'blocked' && 'text-border cursor-not-allowed line-through',
                  inRange && status === 'available' && 'bg-red-primary/20',
                  (isStart || isEnd) && 'bg-red-primary text-accent-cream font-bold',
                )}
              >
                <span>{day}</span>
                {status === 'available' && slotsLeft !== null && slotsLeft <= 3 && slotsLeft > 0 && (
                  <span className="text-[8px] text-yellow-400">{slotsLeft} left</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-primary/20" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-primary/5 border border-red-primary/30" /> Full
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-border/20" /> Blocked
        </span>
      </div>

      {rangeStart && rangeEnd && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-card text-sm">
          <p className="text-text-muted">Selected:</p>
          <p className="text-text-primary font-body">
            {new Date(rangeStart + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            {' → '}
            {new Date(rangeEnd + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
}
