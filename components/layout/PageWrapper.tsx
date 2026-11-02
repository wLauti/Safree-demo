import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function PageWrapper({ children, className, maxWidth = '7xl' }: PageWrapperProps) {
  return (
    <main className={cn('flex-1 px-4 sm:px-6 lg:px-8 py-8', className)}>
      <div className={cn('mx-auto', maxWidthMap[maxWidth])}>
        {children}
      </div>
    </main>
  )
}
