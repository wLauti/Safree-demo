'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { ImagePlus, Loader2, X, MapPin } from 'lucide-react'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const schema = z.object({
  name:           z.string().min(2, 'Name must be at least 2 characters').max(80),
  description:    z.string().max(1000).optional(),
  location_state: z.string().min(1, 'State is required'),
  location_city:  z.string().max(80).optional(),
})

type FormValues = z.infer<typeof schema>

interface CotoSettingsFormProps {
  storeId: string
  defaultValues: FormValues & { logo_url?: string | null; banner_url?: string | null }
}

async function uploadImage(file: File, storeId: string, type: 'logo' | 'banner'): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${storeId}/${type}.${ext}`
  const { error } = await supabase.storage
    .from('stores')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('stores').getPublicUrl(path)
  return data.publicUrl
}

function ImageUploader({
  label,
  value,
  onChange,
  aspect,
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  aspect: 'square' | 'banner'
}) {
  const [uploading, setUploading] = useState(false)

  return (
    <div>
      <p className="text-label text-text-muted mb-2">{label}</p>
      {value ? (
        <div className={`relative rounded-card overflow-hidden bg-bg-secondary ${aspect === 'banner' ? 'h-32 w-full' : 'h-24 w-24'}`}>
          <Image src={value} alt={label} fill className="object-cover" sizes={aspect === 'banner' ? '100vw' : '96px'} />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div className={`relative rounded-card border-2 border-dashed border-border hover:border-red-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${aspect === 'banner' ? 'h-32 w-full' : 'h-24 w-24'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setUploading(true)
              try {
                // We'll handle the upload in the parent via onChange
                onChange('__pending__:' + URL.createObjectURL(file))
                // Store file reference for actual upload
                const input = e.target as HTMLInputElement & { _file?: File }
                input._file = file
              } finally {
                setUploading(false)
              }
            }}
          />
          {uploading
            ? <Loader2 className="h-5 w-5 text-text-muted animate-spin" />
            : <ImagePlus className="h-5 w-5 text-text-muted" />
          }
          <span className="text-[10px] text-text-muted">Upload {label}</span>
        </div>
      )}
    </div>
  )
}

export function CotoSettingsForm({ storeId, defaultValues }: CotoSettingsFormProps) {
  const [logoUrl, setLogoUrl]     = useState<string | null>(defaultValues.logo_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(defaultValues.banner_url ?? null)
  const [logoFile, setLogoFile]   = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:           defaultValues.name,
      description:    defaultValues.description ?? '',
      location_state: defaultValues.location_state ?? 'Texas',
      location_city:  defaultValues.location_city ?? '',
    },
  })

  const supabase = createClient()

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    try {
      let finalLogo   = logoUrl?.startsWith('__pending__:') ? null : (logoUrl ?? null)
      let finalBanner = bannerUrl?.startsWith('__pending__:') ? null : (bannerUrl ?? null)

      // Upload logo if a new file was selected
      if (logoFile) {
        finalLogo = await uploadImage(logoFile, storeId, 'logo')
      }
      // Upload banner if a new file was selected
      if (bannerFile) {
        finalBanner = await uploadImage(bannerFile, storeId, 'banner')
      }

      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          logo_url:   finalLogo,
          banner_url: finalBanner,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? 'Something went wrong')
        notify.error(json.error ?? 'Failed to save')
        return
      }
      notify.success('Coto profile saved!')
    } catch (err: any) {
      setFormError(err.message ?? 'Something went wrong')
      notify.error(err.message ?? 'Failed to save')
    }
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {formError && (
        <div className="p-3 rounded-card bg-red-primary/10 border border-red-primary text-red-primary text-sm">
          {formError}
        </div>
      )}

      {/* Media */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg text-text-primary">Images</h2>

        {/* Banner */}
        <div>
          <p className="text-label text-text-muted mb-2">Banner <span className="text-text-muted/60">(optional, recommended 1200×400)</span></p>
          {bannerUrl && !bannerUrl.startsWith('__pending__:') ? (
            <div className="relative h-36 w-full rounded-card overflow-hidden bg-bg-secondary">
              <Image src={bannerUrl} alt="Banner" fill className="object-cover" sizes="100vw" />
              <button type="button" onClick={() => { setBannerUrl(null); setBannerFile(null) }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors">
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-36 w-full rounded-card border-2 border-dashed border-border hover:border-red-primary transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="sr-only"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setBannerFile(file)
                  setBannerUrl(URL.createObjectURL(file))
                }}
              />
              <ImagePlus className="h-6 w-6 text-text-muted mb-1" />
              <span className="text-xs text-text-muted">Click to upload banner</span>
            </label>
          )}
        </div>

        {/* Logo */}
        <div>
          <p className="text-label text-text-muted mb-2">Logo <span className="text-text-muted/60">(optional, square)</span></p>
          {logoUrl && !logoUrl.startsWith('__pending__:') ? (
            <div className="relative h-24 w-24 rounded-card overflow-hidden bg-bg-secondary">
              <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" />
              <button type="button" onClick={() => { setLogoUrl(null); setLogoFile(null) }}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black/80 transition-colors">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-24 w-24 rounded-card border-2 border-dashed border-border hover:border-red-primary transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="sr-only"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setLogoFile(file)
                  setLogoUrl(URL.createObjectURL(file))
                }}
              />
              <ImagePlus className="h-5 w-5 text-text-muted mb-1" />
              <span className="text-[10px] text-text-muted text-center">Logo</span>
            </label>
          )}
        </div>
      </section>

      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg text-text-primary">Basic Info</h2>
        <Input
          label="Coto Name"
          placeholder="e.g. Rancho El Venado"
          error={errors.name?.message}
          {...register('name')}
        />
        <div>
          <label className="block text-label text-text-muted mb-1.5">Description <span className="text-text-muted/60">(optional)</span></label>
          <textarea
            rows={4}
            placeholder="Describe your property — terrain, wildlife, facilities, what makes it special..."
            className="input-base w-full resize-y"
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-xs text-red-primary">{errors.description.message}</p>}
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-primary" />
          <h2 className="font-heading text-lg text-text-primary">Location</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-label text-text-muted mb-1.5">State <span className="text-red-primary">*</span></label>
            <select className="input-base w-full" {...register('location_state')}>
              <option value="">— Select —</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.location_state && <p className="mt-1 text-xs text-red-primary">{errors.location_state.message}</p>}
          </div>
          <Input
            label="City / County (optional)"
            placeholder="e.g. Laredo"
            error={errors.location_city?.message}
            {...register('location_city')}
          />
        </div>
      </section>

      <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
        Save Coto Profile
      </Button>
    </form>
  )
}
