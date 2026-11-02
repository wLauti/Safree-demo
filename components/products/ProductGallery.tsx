'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductGalleryProps {
  images: string[]
  title: string
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const prev = () => setActive(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActive(i => (i === images.length - 1 ? 0 : i + 1))

  if (!images.length) {
    return (
      <div className="aspect-square bg-bg-secondary rounded-card flex items-center justify-center text-text-muted">
        No images
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded-card overflow-hidden bg-bg-secondary cursor-zoom-in"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={images[active]}
          alt={`${title} — image ${active + 1}`}
          fill
          priority={active === 0}
          className={cn(
            'object-cover transition-transform duration-100',
            zoomed ? 'scale-150' : 'scale-100'
          )}
          style={zoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : undefined}
          sizes="(max-width:768px) 100vw, 50vw"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {active + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors',
                active === i ? 'border-red-primary' : 'border-border hover:border-text-muted'
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
