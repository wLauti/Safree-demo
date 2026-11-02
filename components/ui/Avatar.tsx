import { cn } from '@/lib/utils/cn'
import Image from 'next/image'
import { getInitials } from '@/lib/utils/formatters'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  verified?: boolean
  className?: string
}

const sizeMap: Record<AvatarSize, { container: string; text: string; ring: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', ring: 'ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', ring: 'ring-1' },
  md: { container: 'w-10 h-10', text: 'text-sm', ring: 'ring-2' },
  lg: { container: 'w-14 h-14', text: 'text-base', ring: 'ring-2' },
  xl: { container: 'w-20 h-20', text: 'text-xl', ring: 'ring-2' },
}

export function Avatar({ src, name, size = 'md', verified = false, className }: AvatarProps) {
  const { container, text, ring } = sizeMap[size]
  const initials = name ? getInitials(name) : '?'

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center',
          container,
          verified && `${ring} ring-accent-cream ring-offset-1 ring-offset-bg-primary`
        )}
      >
        {src ? (
          <Image src={src} alt={name ?? 'Avatar'} fill className="object-cover" />
        ) : (
          <span className={cn('font-heading text-text-muted select-none', text)}>{initials}</span>
        )}
      </div>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-accent-cream rounded-full w-3.5 h-3.5 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-red-primary" viewBox="0 0 12 12" fill="currentColor">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      )}
    </div>
  )
}
