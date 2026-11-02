'use client'

import { cn } from '@/lib/utils/cn'
import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  badge?: number
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
  onTabChange?: (id: string) => void
}

export function Tabs({ tabs, defaultTab, className, onTabChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)

  const handleChange = (id: string) => {
    setActive(id)
    onTabChange?.(id)
  }

  const current = tabs.find(t => t.id === active)

  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              'px-5 py-3 text-sm font-body font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              active === tab.id
                ? 'text-accent-cream border-red-primary'
                : 'text-text-muted border-transparent hover:text-text-primary'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 text-[10px] bg-red-primary text-accent-cream rounded-full px-1.5 py-0.5">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-6">{current?.content}</div>
    </div>
  )
}
