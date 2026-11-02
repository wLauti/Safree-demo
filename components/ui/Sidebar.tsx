'use client'

import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useRole } from '@/hooks/useRole'
import type { ReactNode } from 'react'
import type { UserRole } from '@/lib/supabase/types'

interface NavItem {
  href: string
  label: string
  icon: ReactNode
  roles?: UserRole[]
  badge?: string | number
}

interface SidebarProps {
  items: NavItem[]
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

export function Sidebar({ items, header, footer, className }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { role } = useRole()
  const pathname = usePathname()

  const visibleItems = items.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  )

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-bg-secondary border-r border-border transition-all duration-300 ease-in-out h-full',
        sidebarOpen ? 'w-64' : 'w-16',
        className
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-10 bg-bg-secondary border border-border rounded-full p-0.5 text-text-muted hover:text-text-primary transition-colors"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Header */}
      {header && (
        <div className={cn('p-4 border-b border-border overflow-hidden', !sidebarOpen && 'px-2')}>
          {header}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-2">
          {visibleItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-card text-sm transition-colors duration-150 group',
                    active
                      ? 'bg-red-primary text-accent-cream'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-primary',
                    !sidebarOpen && 'justify-center px-2'
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="font-body flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="bg-red-primary text-accent-cream text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {footer && (
        <div className={cn('p-4 border-t border-border overflow-hidden', !sidebarOpen && 'px-2')}>
          {footer}
        </div>
      )}
    </aside>
  )
}
