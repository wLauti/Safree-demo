'use client'

import { useSaved } from '@/hooks/useSaved'
import { useAuth } from '@/hooks/useAuth'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { notify } from '@/components/ui/Notification'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SaveButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md'
}

export function SaveButton({ productId, className, size = 'sm' }: SaveButtonProps) {
  const { user } = useAuth()
  const { isSaved, toggleSaved } = useSaved()
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const saved = isSaved(productId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push('/login')
      return
    }
    setPending(true)
    const nowSaved = await toggleSaved(productId)
    notify.success(nowSaved ? 'Saved to wishlist' : 'Removed from wishlist')
    setPending(false)
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'flex items-center justify-center rounded-full transition-all',
        btnSize,
        saved
          ? 'bg-red-primary text-accent-cream hover:bg-red-dark'
          : 'bg-bg-primary/80 text-text-muted hover:text-red-primary hover:bg-bg-primary',
        pending && 'opacity-50',
        className
      )}
    >
      <Heart className={cn(iconSize, saved && 'fill-current')} />
    </button>
  )
}
