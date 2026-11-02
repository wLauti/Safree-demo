'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Loader'
import { notify } from '@/components/ui/Notification'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Divider } from '@/components/ui/Divider'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight, Save, Lock, Unlock, Copy } from 'lucide-react'

interface AvailRow {
  date: string
  slots: number
  slots_booked: number
  is_blocked: boolean
}

interface DayState {
  date: string
  slots: number
  is_blocked: boolean
  changed: boolean
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate() }
function firstDayOfMonth(year: number, month: number) { return new Date(year, month - 1, 1).getDay() }
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function AvailabilityManagerPage() {
  const { id: experienceId } = useParams<{ id: string }>()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [dayStates, setDayStates] = useState<Map<string, DayState>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bulkSlots, setBulkSlots] = useState('1')
  const [experienceTitle, setExperienceTitle] = useState('')

  const fetchAvailability = async () => {
    setLoading(true)
    const res = await fetch(`/api/experiences/${experienceId}/availability?year=${year}&month=${month}`)
    const { availability } = await res.json()

    const days = daysInMonth(year, month)
    const newMap = new Map<string, DayState>()
    for (let d = 1; d <= days; d++) {
      const iso = toISO(year, month, d)
      const row = (availability as AvailRow[]).find(a => a.date === iso)
      newMap.set(iso, {
        date: iso,
        slots: row?.slots ?? 0,
        is_blocked: row?.is_blocked ?? false,
        changed: false,
      })
    }
    setDayStates(newMap)
    setLoading(false)
  }

  // Fetch experience title
  useEffect(() => {
    fetch(`/api/store/experiences`)
      .then(r => r.json())
      .then(({ experiences }) => {
        const exp = experiences?.find((e: any) => e.id === experienceId)
        if (exp) setExperienceTitle(exp.title)
      })
  }, [experienceId])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAvailability() }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const updateDay = (iso: string, partial: Partial<DayState>) => {
    setDayStates(prev => {
      const next = new Map(prev)
      const current = next.get(iso)!
      next.set(iso, { ...current, ...partial, changed: true })
      return next
    })
  }

  // Bulk: set all available (non-blocked) days to N slots
  const applyBulkSlots = () => {
    const slots = parseInt(bulkSlots) || 0
    setDayStates(prev => {
      const next = new Map(prev)
      next.forEach((state, iso) => {
        if (!state.is_blocked && iso >= today.toISOString().split('T')[0]) {
          next.set(iso, { ...state, slots, changed: true })
        }
      })
      return next
    })
  }

  // Bulk: block/unblock entire month
  const blockMonth = (block: boolean) => {
    setDayStates(prev => {
      const next = new Map(prev)
      next.forEach((state, iso) => {
        if (iso >= today.toISOString().split('T')[0]) {
          next.set(iso, { ...state, is_blocked: block, changed: true })
        }
      })
      return next
    })
  }

  const save = async () => {
    const changed: DayState[] = []
    dayStates.forEach(d => { if (d.changed) changed.push(d) })
    if (changed.length === 0) { notify.success('No changes to save'); return }

    setSaving(true)
    const res = await fetch(`/api/experiences/${experienceId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dates: changed.map(d => ({ date: d.date, slots: d.slots, is_blocked: d.is_blocked })),
      }),
    })

    setSaving(false)
    if (res.ok) {
      notify.success(`Saved ${changed.length} date${changed.length !== 1 ? 's' : ''}`)
      fetchAvailability()
    } else {
      notify.error('Failed to save availability')
    }
  }

  const days = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)
  let hasChanges = false
  dayStates.forEach(d => { if (d.changed) hasChanges = true })

  return (
    <PageWrapper>
      <div className="py-6 max-w-3xl">
        <Breadcrumb crumbs={[
          { label: 'My Experiences', href: '/store/experiences' },
          { label: experienceTitle || 'Experience', href: `/store/experiences` },
          { label: 'Availability' },
        ]} />

        <div className="flex items-center justify-between mt-4 mb-1">
          <h1 className="text-h1 text-text-primary">Manage Availability</h1>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!hasChanges}
            onClick={save}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
        <p className="text-text-muted mb-6">{experienceTitle}</p>
        <Divider />

        {/* Bulk actions */}
        <div className="mt-6 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted">Set all available to</label>
            <input
              type="number"
              min="0"
              max="99"
              value={bulkSlots}
              onChange={e => setBulkSlots(e.target.value)}
              className="input-base w-16 text-center text-sm"
            />
            <span className="text-sm text-text-muted">slots</span>
            <Button variant="secondary" size="sm" onClick={applyBulkSlots} leftIcon={<Copy className="h-3.5 w-3.5" />}>
              Apply
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => blockMonth(true)} leftIcon={<Lock className="h-3.5 w-3.5" />}>
              Block Month
            </Button>
            <Button variant="ghost" size="sm" onClick={() => blockMonth(false)} leftIcon={<Unlock className="h-3.5 w-3.5" />}>
              Unblock Month
            </Button>
          </div>
        </div>

        {/* Calendar navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 text-text-muted hover:text-text-primary">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-xl text-text-primary">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 text-text-muted hover:text-text-primary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs text-text-muted pb-2">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}

            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1
              const iso = toISO(year, month, day)
              const state = dayStates.get(iso)
              const isPast = iso < today.toISOString().split('T')[0]

              if (!state) return <div key={iso} />

              return (
                <div
                  key={iso}
                  className={cn(
                    'flex flex-col items-center p-1.5 rounded-card border transition-colors text-center',
                    state.changed && 'ring-1 ring-accent-cream/40',
                    state.is_blocked ? 'bg-red-primary/10 border-red-primary/30' : 'border-border bg-bg-secondary',
                    isPast && 'opacity-40 pointer-events-none',
                  )}
                >
                  <span className={cn(
                    'text-xs font-body mb-1',
                    state.is_blocked ? 'text-red-primary' : 'text-text-muted'
                  )}>
                    {day}
                  </span>

                  {!state.is_blocked ? (
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={state.slots}
                      onChange={e => updateDay(iso, { slots: parseInt(e.target.value) || 0 })}
                      disabled={isPast}
                      className="w-8 bg-bg-primary border border-border rounded text-center text-xs text-text-primary py-0.5 focus:border-red-primary focus:outline-none"
                    />
                  ) : (
                    <span className="text-[9px] text-red-primary/70">blocked</span>
                  )}

                  <button
                    type="button"
                    onClick={() => updateDay(iso, { is_blocked: !state.is_blocked })}
                    disabled={isPast}
                    className={cn(
                      'mt-1 w-4 h-4 rounded flex items-center justify-center transition-colors',
                      state.is_blocked ? 'bg-red-primary' : 'bg-border hover:bg-red-primary/50'
                    )}
                    title={state.is_blocked ? 'Unblock' : 'Block'}
                  >
                    {state.is_blocked
                      ? <Lock className="h-2.5 w-2.5 text-accent-cream" />
                      : <Unlock className="h-2.5 w-2.5 text-text-muted" />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-6 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-bg-secondary border border-border" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-primary/10 border border-red-primary/30" /> Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded ring-1 ring-accent-cream/40" /> Changed
          </span>
        </div>

        {hasChanges && (
          <div className="mt-6 p-3 bg-accent-cream/5 border border-accent-cream/20 rounded-card text-sm text-text-muted">
            You have unsaved changes. Click <strong className="text-accent-cream">Save Changes</strong> to apply.
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
