import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PhotoBannerProps {
  /** Full CDN image URL (see lib/utils/images.ts). */
  image: string
  title: string
  subtitle?: ReactNode
  /** Small uppercase eyebrow label above the title. */
  eyebrow?: string
  children?: ReactNode
  /** Vertical size of the banner. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'py-12 lg:py-16',
  md: 'py-16 lg:py-24',
  lg: 'py-24 lg:py-36',
}

/**
 * Full-bleed photographic banner with a dark gradient overlay so cream text
 * stays legible over any image. Used as the header on listing pages and for
 * CTA sections. The image is a CSS background (no layout shift, no Next/Image
 * remotePattern needed).
 */
export function PhotoBanner({
  image,
  title,
  subtitle,
  eyebrow,
  children,
  size = 'md',
  className,
}: PhotoBannerProps) {
  return (
    <section
      className={cn('relative overflow-hidden bg-bg-primary bg-cover bg-center', className)}
      style={{ backgroundImage: `url('${image}')` }}
    >
      {/* Darken + warm tint toward the red-dark theme accent for legibility. */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-bg-primary/40" />
      <div className="absolute inset-0 bg-red-dark/10 mix-blend-multiply" />
      <div className={cn('relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', sizeMap[size])}>
        {eyebrow && (
          <p className="text-label text-red-primary mb-3 tracking-widest">{eyebrow}</p>
        )}
        <h1 className="text-h1 text-accent-cream drop-shadow-lg mb-3">{title}</h1>
        {subtitle && (
          <p className="text-body-lg text-accent-cream/80 max-w-2xl drop-shadow">{subtitle}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}
