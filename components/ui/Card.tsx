import { cn } from '@/lib/utils/cn'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from './Badge'
import { Rating } from './Rating'
import { formatCurrency } from '@/lib/utils/formatters'
import type { ReactNode } from 'react'

type CardVariant = 'product' | 'experience' | 'store' | 'stat'

interface BaseCardProps {
  variant?: CardVariant
  className?: string
  children?: ReactNode
}

// ── Generic wrapper ──────────────────────────────────────────
export function Card({ variant = 'product', className, children }: BaseCardProps) {
  return (
    <div className={cn('card-base overflow-hidden', className)}>
      {children}
    </div>
  )
}

// ── Product card ─────────────────────────────────────────────
interface ProductCardProps {
  id: string
  title: string
  price: number
  compare_at_price?: number | null
  image_url?: string | null
  store_name?: string
  rating?: number
  review_count?: number
  badge?: string
  className?: string
}

export function ProductCard({ id, title, price, compare_at_price, image_url, store_name, rating, review_count, badge, className }: ProductCardProps) {
  const isOnSale = compare_at_price && compare_at_price > price
  return (
    <Link href={`/products/${id}`} className={cn('card-base block overflow-hidden group hover:border-red-primary transition-colors duration-200', className)}>
      <div className="relative aspect-square bg-bg-primary overflow-hidden">
        {image_url
          ? <Image src={image_url} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="flex items-center justify-center h-full text-text-muted text-sm">No image</div>
        }
        {badge && <div className="absolute top-2 left-2"><Badge variant="sale">{badge}</Badge></div>}
        {isOnSale && !badge && <div className="absolute top-2 left-2"><Badge variant="sale">Sale</Badge></div>}
      </div>
      <div className="p-4">
        {store_name && <p className="text-label text-text-muted mb-1">{store_name}</p>}
        <h3 className="font-heading text-text-primary text-base leading-tight mb-2 line-clamp-2">{title}</h3>
        {rating !== undefined && (
          <div className="mb-2">
            <Rating value={rating} readonly size="sm" />
            {review_count !== undefined && <span className="text-text-muted text-xs ml-1">({review_count})</span>}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-lg text-accent-cream">{formatCurrency(price)}</span>
          {isOnSale && <span className="text-text-muted text-sm line-through">{formatCurrency(compare_at_price)}</span>}
        </div>
      </div>
    </Link>
  )
}

// ── Experience card ──────────────────────────────────────────
interface ExperienceCardProps {
  id: string
  slug?: string | null
  title: string
  type?: 'hunt' | 'fishing' | null
  price_per_person: number
  image_url?: string | null
  location_state?: string | null
  location_city?: string | null
  duration_days?: number | null
  rating?: number
  review_count?: number
  species?: string[]
  is_verified?: boolean
  className?: string
}

export function ExperienceCard({ id, slug, title, type, price_per_person, image_url, location_state, location_city, duration_days, rating, review_count, species, is_verified, className }: ExperienceCardProps) {
  const href = slug ? `/experiences/${slug}` : `/experiences/${id}`
  return (
    <Link href={href} className={cn('card-base block overflow-hidden group hover:border-red-primary transition-colors duration-200', className)}>
      <div className="relative aspect-[4/3] bg-bg-primary overflow-hidden">
        {image_url
          ? <Image src={image_url} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px)100vw,400px" />
          : <div className="flex items-center justify-center h-full text-text-muted text-sm">No image</div>
        }
        {type && (
          <div className="absolute top-2 left-2">
            <Badge variant={type === 'fishing' ? 'default' : 'sale'}>{type === 'fishing' ? 'FISHING' : 'HUNT'}</Badge>
          </div>
        )}
        {is_verified && <div className="absolute top-2 right-2"><Badge variant="verified">Verified</Badge></div>}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          {(location_city || location_state) && (
            <p className="text-accent-cream text-xs font-body">
              {[location_city, location_state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-text-primary text-base leading-tight mb-2 line-clamp-2">{title}</h3>
        {species && species.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {species.slice(0, 3).map(s => <Badge key={s} variant="species">{s}</Badge>)}
          </div>
        )}
        {rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            <Rating value={rating} readonly size="sm" />
            {review_count !== undefined && <span className="text-text-muted text-xs">({review_count})</span>}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-heading text-lg text-accent-cream">{formatCurrency(price_per_person)}</span>
            <span className="text-text-muted text-xs ml-1">/ person</span>
          </div>
          {duration_days && <span className="text-text-muted text-xs">{duration_days}d</span>}
        </div>
      </div>
    </Link>
  )
}

// ── Store card ───────────────────────────────────────────────
interface StoreCardProps {
  id: string
  name: string
  logo_url?: string | null
  location_state?: string | null
  is_verified?: boolean
  subtype?: 'store' | 'coto'
  className?: string
}

export function StoreCard({ id, name, logo_url, location_state, is_verified, subtype, className }: StoreCardProps) {
  return (
    <Link href={`/stores/${id}`} className={cn('card-base flex items-center gap-4 p-4 hover:border-red-primary transition-colors duration-200', className)}>
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg-primary flex-shrink-0">
        {logo_url
          ? <Image src={logo_url} alt={name} fill className="object-cover" />
          : <div className="flex items-center justify-center h-full font-heading text-xl text-text-muted">{name[0]}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-text-primary truncate">{name}</h3>
          {is_verified && <Badge variant="verified">Verified</Badge>}
        </div>
        {location_state && <p className="text-text-muted text-sm">{location_state}</p>}
        {subtype && <p className="text-label text-red-primary mt-1">{subtype === 'coto' ? 'Hunting Ground' : 'Store'}</p>}
      </div>
    </Link>
  )
}

// ── Stat card ────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('card-base p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label text-text-muted mb-1">{label}</p>
          <p className="font-heading text-3xl text-accent-cream">{value}</p>
        </div>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      {trend && (
        <p className={cn('text-sm mt-3', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </div>
  )
}
