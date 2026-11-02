'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { X, Plus, MapPin } from 'lucide-react'
import Image from 'next/image'

// Leaflet uses window — load client-only, no SSR.
const LocationPicker = dynamic(
  () => import('@/components/maps/LocationPicker').then(m => m.LocationPicker),
  { ssr: false }
)

// ── Schema ────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(3).max(120),
  type: z.enum(['hunt', 'fishing']),
  description: z.string().optional(),
  terrain_description: z.string().optional(),
  price_per_person: z.coerce.number().positive(),
  max_guests: z.coerce.number().int().min(1).max(50),
  min_booking_days: z.coerce.number().int().min(1).default(1),
  duration_days: z.coerce.number().int().positive().optional(),
  location_state: z.string().min(1, 'State required'),
  location_city: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const AMENITY_OPTIONS = [
  { key: 'guide', label: 'Guide included' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'meals', label: 'Meals' },
  { key: 'transport', label: 'Transport' },
  { key: 'equipment', label: 'Equipment provided' },
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

interface Species { id: string; name: string; type: string }

interface Props {
  allSpecies: Species[]
  initialData?: any
  experienceId?: string
}

export function ExperienceForm({ allSpecies, initialData, experienceId }: Props) {
  const router = useRouter()

  const [images, setImages] = useState<string[]>(initialData?.images ?? [])
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(initialData?.species_ids ?? [])
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities ?? [])
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(
    initialData?.location_coords?.coordinates
      ? { lng: initialData.location_coords.coordinates[0], lat: initialData.location_coords.coordinates[1] }
      : null
  )
  const [customSpeciesInput, setCustomSpeciesInput] = useState('')
  const [speciesSearch, setSpeciesSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      type: initialData?.type ?? 'hunt',
      description: initialData?.description ?? '',
      terrain_description: initialData?.terrain_description ?? '',
      price_per_person: initialData?.price_per_person ?? '',
      max_guests: initialData?.max_guests ?? 1,
      min_booking_days: initialData?.min_booking_days ?? 1,
      duration_days: initialData?.duration_days ?? '',
      location_state: initialData?.location_state ?? 'Texas',
      location_city: initialData?.location_city ?? '',
      video_url: initialData?.video_url ?? '',
    },
  })

  // ── Image upload handler ─────────────────────────────────────
  const pendingFilesRef = useRef<File[]>([])

  const handleFilesChange = useCallback((files: File[]) => {
    // Just track the latest file selection — actual upload happens on submit
    pendingFilesRef.current = files
  }, [])

  const uploadPendingImages = async (): Promise<string[]> => {
    const files = pendingFilesRef.current
    if (files.length === 0) return []
    const supabase = createClient()
    const uploaded: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `experiences/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (error) { notify.error(`Failed to upload ${file.name}: ${error.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path)
      uploaded.push(publicUrl)
    }
    return uploaded
  }
  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))

  // ── Custom species ───────────────────────────────────────────
  const addCustomSpecies = async () => {
    if (!customSpeciesInput.trim()) return
    const res = await fetch('/api/species', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customSpeciesInput.trim(), type: 'game' }),
    })
    const { species } = await res.json()
    if (species) {
      setSelectedSpecies(prev => [...prev, species.id])
      setCustomSpeciesInput('')
      notify.success('Custom species submitted for approval')
    }
  }

  const toggleSpecies = (id: string) => {
    setSelectedSpecies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const toggleAmenity = (key: string) => {
    setAmenities(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])
  }

  // ── Submit ───────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true)

    // Upload any newly selected files now
    const newUrls = await uploadPendingImages()
    const allImages = [...images, ...newUrls]

    if (allImages.length < 3) {
      notify.error('Please upload at least 3 photos')
      setSubmitting(false)
      return
    }

    const payload = {
      ...data,
      images: allImages,
      species_ids: selectedSpecies,
      amenities,
      location_coords: coords ? `POINT(${coords.lng} ${coords.lat})` : null,
      video_url: data.video_url || null,
      duration_days: data.duration_days || null,
    }

    const url = experienceId
      ? `/api/store/experiences/${experienceId}`
      : '/api/store/experiences'
    const method = experienceId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      notify.error(json.error ?? 'Failed to save experience')
      return
    }

    notify.success(experienceId ? 'Experience updated and sent for review' : 'Experience submitted for review!')
    router.push('/store/experiences')
    router.refresh()
  }

  const filteredSpecies = allSpecies.filter(s =>
    !speciesSearch || s.name.toLowerCase().includes(speciesSearch.toLowerCase())
  )

  const Field = ({ label, error, required, children }: any) => (
    <div>
      <label className="block text-sm text-text-muted mb-1.5">
        {label}{required && <span className="text-red-primary ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-primary mt-1">{error.message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Photos ───────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-4">
          Photos <span className="text-text-muted text-sm font-body">(min 3, max 12)</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-card overflow-hidden bg-bg-secondary">
              <Image src={url} alt="" fill className="object-cover" sizes="150px" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-bg-primary/80 rounded-full flex items-center justify-center text-text-primary hover:bg-red-primary"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-1 left-1 bg-bg-primary/80 rounded px-1.5 py-0.5 text-[9px] text-accent-cream">
                  Cover
                </div>
              )}
            </div>
          ))}
          {images.length < 12 && (
            <FileUpload
              onFilesChange={handleFilesChange}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              multiple
              maxFiles={12 - images.length}
              className="aspect-square"
              label="Click or drag to add photos"
            />
          )}
        </div>
        {images.length < 3 && (
          <p className="text-xs text-text-muted">{3 - images.length} more photo{3 - images.length !== 1 ? 's' : ''} required</p>
        )}
      </section>

      {/* ── Basic Info ───────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="font-heading text-lg text-text-primary">Basic Info</h2>

        <Field label="Title" error={errors.title} required>
          <input {...register('title')} placeholder="e.g. East Texas Whitetail Ranch" className="input-base w-full" />
        </Field>

        <Field label="Type" error={errors.type} required>
          <div className="flex gap-3">
            {(['hunt', 'fishing'] as const).map(t => {
              const current = watch('type')
              return (
                <label key={t} className={cn(
                  'flex items-center gap-2 cursor-pointer px-4 py-2 rounded-card border transition-colors text-sm',
                  current === t ? 'border-red-primary bg-red-primary/10 text-accent-cream' : 'border-border text-text-muted'
                )}>
                  <input type="radio" {...register('type')} value={t} className="hidden" />
                  {t === 'hunt' ? '🦌' : '🎣'} {t === 'hunt' ? 'Hunting Ground' : 'Fishing Lodge'}
                </label>
              )
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price per person / day (USD)" error={errors.price_per_person} required>
            <input {...register('price_per_person')} type="number" min="1" step="0.01" placeholder="250" className="input-base w-full" />
          </Field>
          <Field label="Max hunters" error={errors.max_guests} required>
            <input {...register('max_guests')} type="number" min="1" max="50" placeholder="6" className="input-base w-full" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min. booking days" error={errors.min_booking_days}>
            <input {...register('min_booking_days')} type="number" min="1" placeholder="1" className="input-base w-full" />
          </Field>
          <Field label="Duration (days)" error={errors.duration_days}>
            <input {...register('duration_days')} type="number" min="1" placeholder="3" className="input-base w-full" />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Describe the experience, rules, and what makes it special..."
            className="input-base w-full resize-none"
          />
        </Field>

        <Field label="Terrain & Environment">
          <textarea
            {...register('terrain_description')}
            rows={3}
            placeholder="Describe the land, vegetation, and terrain features..."
            className="input-base w-full resize-none"
          />
        </Field>

        <Field label="Video URL" error={errors.video_url}>
          <input {...register('video_url')} type="url" placeholder="https://youtube.com/watch?v=..." className="input-base w-full" />
        </Field>
      </section>

      {/* ── Location ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg text-text-primary">Location</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="State" error={errors.location_state} required>
            <select {...register('location_state')} className="input-base w-full">
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="City" error={errors.location_city}>
            <input {...register('location_city')} placeholder="Austin" className="input-base w-full" />
          </Field>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Map Pin <span className="text-text-muted text-xs">(click map to place, drag to adjust)</span>
          </label>
          <div className="rounded-card overflow-hidden h-52 bg-bg-secondary relative">
            <LocationPicker value={coords} onChange={setCoords} />
          </div>
          {coords && (
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>
      </section>

      {/* ── Species ──────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-1">Species Available</h2>
        <p className="text-text-muted text-sm mb-4">Select all species that hunters can target at your property.</p>

        <input
          placeholder="Search species..."
          value={speciesSearch}
          onChange={e => setSpeciesSearch(e.target.value)}
          className="input-base w-full mb-3 text-sm"
        />

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-3">
          {filteredSpecies.map(sp => (
            <button
              type="button"
              key={sp.id}
              onClick={() => toggleSpecies(sp.id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs border transition-colors',
                selectedSpecies.includes(sp.id)
                  ? 'bg-red-primary border-red-primary text-accent-cream'
                  : 'border-border text-text-muted hover:border-text-muted'
              )}
            >
              {sp.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={customSpeciesInput}
            onChange={e => setCustomSpeciesInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSpecies())}
            placeholder="Add custom species..."
            className="input-base flex-1 text-sm"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addCustomSpecies}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-1">Custom species require admin approval before appearing in search.</p>
      </section>

      {/* ── Amenities ────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-4">What&apos;s Included</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AMENITY_OPTIONS.map(opt => (
            <label key={opt.key} className={cn(
              'flex items-center gap-2 cursor-pointer px-3 py-2 rounded-card border text-sm transition-colors',
              amenities.includes(opt.key)
                ? 'border-green-500 bg-green-500/10 text-text-primary'
                : 'border-border text-text-muted'
            )}>
              <input
                type="checkbox"
                checked={amenities.includes(opt.key)}
                onChange={() => toggleAmenity(opt.key)}
                className="accent-red-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* ── Submit ───────────────────────────────────────── */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" variant="primary" size="lg" loading={submitting}>
          {experienceId ? 'Save Changes' : 'Submit for Review'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
