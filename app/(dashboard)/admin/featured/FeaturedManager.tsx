'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { Trash2, Plus } from 'lucide-react'

interface Slide {
  id: string
  image_url: string
  headline: string
  subtext: string | null
  cta_text: string | null
  cta_url: string | null
  is_active: boolean
  sort_order: number
}
interface FeaturedItem { id: string; section: string; ref_type: string; ref_id: string; _title: string; sale_price: number | null }
interface PickerOption { id: string; title: string; type: 'product' | 'experience' }

const SECTIONS = [
  { key: 'most_notable', label: 'Most Notable', limit: 6 },
  { key: 'featured_grounds', label: 'Featured Hunting Grounds', limit: 6 },
  { key: 'featured_deals', label: 'Featured Deals', limit: 12 },
]

export function FeaturedManager({
  slides, featured, options,
}: {
  slides: Slide[]
  featured: FeaturedItem[]
  options: PickerOption[]
}) {
  const router = useRouter()

  // ── Hero slide form ─────────────────────────────────────
  const [slideForm, setSlideForm] = useState({ image_url: '', headline: '', subtext: '', cta_text: '', cta_url: '' })
  const [addingSlide, setAddingSlide] = useState(false)

  const createSlide = async () => {
    if (!slideForm.image_url || !slideForm.headline) { notify.error('Image and headline required'); return }
    const res = await fetch('/api/admin/hero-slides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...slideForm, sort_order: slides.length }),
    })
    if (res.ok) { notify.success('Slide added'); setSlideForm({ image_url: '', headline: '', subtext: '', cta_text: '', cta_url: '' }); setAddingSlide(false); router.refresh() }
    else notify.error('Failed')
  }

  const deleteSlide = async (id: string) => {
    const res = await fetch(`/api/admin/hero-slides?id=${id}`, { method: 'DELETE' })
    if (res.ok) { notify.success('Removed'); router.refresh() }
  }

  const toggleSlide = async (id: string, is_active: boolean) => {
    await fetch('/api/admin/hero-slides', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    router.refresh()
  }

  // ── Featured sections ───────────────────────────────────
  const addFeatured = async (section: string, ref: string, salePrice?: string) => {
    const opt = options.find(o => o.id === ref)
    if (!opt) return
    const res = await fetch('/api/admin/featured', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, ref_type: opt.type, ref_id: ref, sale_price: salePrice ? parseFloat(salePrice) : null }),
    })
    if (res.ok) { notify.success('Added to ' + section); router.refresh() }
    else notify.error((await res.json()).error ?? 'Failed')
  }

  const removeFeatured = async (id: string) => {
    const res = await fetch(`/api/admin/featured?id=${id}`, { method: 'DELETE' })
    if (res.ok) { notify.success('Removed'); router.refresh() }
  }

  return (
    <div className="space-y-12">

      {/* ── Hero Carousel ──────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-4">Homepage Hero Carousel</h2>
        <div className="space-y-2 mb-3">
          {slides.map(slide => (
            <div key={slide.id} className="card-base p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.image_url} alt="" className="w-20 h-12 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-body line-clamp-1">{slide.headline}</p>
                {slide.cta_text && <p className="text-text-muted text-xs">CTA: {slide.cta_text} → {slide.cta_url}</p>}
              </div>
              <button onClick={() => toggleSlide(slide.id, slide.is_active)}
                className={`text-xs px-2 py-1 rounded-full ${slide.is_active ? 'bg-green-900/60 text-green-300' : 'bg-bg-secondary text-text-muted'}`}>
                {slide.is_active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => deleteSlide(slide.id)} className="text-text-muted hover:text-red-primary">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {addingSlide ? (
          <div className="card-base p-4 space-y-3">
            <input placeholder="Image URL" value={slideForm.image_url} onChange={e => setSlideForm(f => ({ ...f, image_url: e.target.value }))} className="input-base w-full text-sm" />
            <input placeholder="Headline" value={slideForm.headline} onChange={e => setSlideForm(f => ({ ...f, headline: e.target.value }))} className="input-base w-full text-sm" />
            <input placeholder="Subtext" value={slideForm.subtext} onChange={e => setSlideForm(f => ({ ...f, subtext: e.target.value }))} className="input-base w-full text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="CTA text" value={slideForm.cta_text} onChange={e => setSlideForm(f => ({ ...f, cta_text: e.target.value }))} className="input-base text-sm" />
              <input placeholder="CTA URL" value={slideForm.cta_url} onChange={e => setSlideForm(f => ({ ...f, cta_url: e.target.value }))} className="input-base text-sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={createSlide}>Add Slide</Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingSlide(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddingSlide(true)}>Add Slide</Button>
        )}
      </section>

      {/* ── Curated sections ───────────────────────────────── */}
      {SECTIONS.map(section => {
        const items = featured.filter(f => f.section === section.key)
        const isDeals = section.key === 'featured_deals'
        return (
          <FeaturedSection
            key={section.key}
            section={section}
            items={items}
            options={options}
            isDeals={isDeals}
            onAdd={addFeatured}
            onRemove={removeFeatured}
          />
        )
      })}
    </div>
  )
}

function FeaturedSection({ section, items, options, isDeals, onAdd, onRemove }: {
  section: { key: string; label: string; limit: number }
  items: FeaturedItem[]
  options: PickerOption[]
  isDeals: boolean
  onAdd: (section: string, ref: string, salePrice?: string) => void
  onRemove: (id: string) => void
}) {
  const [pick, setPick] = useState('')
  const [salePrice, setSalePrice] = useState('')

  // For grounds, only experiences; deals/notable allow both
  const filtered = section.key === 'featured_grounds'
    ? options.filter(o => o.type === 'experience')
    : options

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg text-text-primary">{section.label}</h2>
        <span className="text-text-muted text-xs">{items.length}/{section.limit}</span>
      </div>

      <div className="space-y-2 mb-3">
        {items.map(item => (
          <div key={item.id} className="card-base p-3 flex items-center justify-between">
            <div>
              <p className="text-text-primary text-sm">{item._title}</p>
              <p className="text-text-muted text-xs">{item.ref_type}{item.sale_price ? ` · sale $${item.sale_price}` : ''}</p>
            </div>
            <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-red-primary">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-text-muted text-sm">Nothing featured yet.</p>}
      </div>

      {items.length < section.limit && (
        <div className="flex gap-2 items-center">
          <select value={pick} onChange={e => setPick(e.target.value)} className="input-base text-sm flex-1">
            <option value="">Select a listing…</option>
            {filtered.map(o => <option key={o.id} value={o.id}>[{o.type}] {o.title}</option>)}
          </select>
          {isDeals && (
            <input placeholder="Sale $" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="input-base text-sm w-24" />
          )}
          <Button variant="secondary" size="sm" disabled={!pick} onClick={() => { onAdd(section.key, pick, salePrice); setPick(''); setSalePrice('') }}>
            Add
          </Button>
        </div>
      )}
    </section>
  )
}
