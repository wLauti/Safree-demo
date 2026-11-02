'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { notify } from '@/components/ui/Notification'
import { createClient } from '@/lib/supabase/client'
import { uploadProductImage } from '@/lib/supabase/storage'
import { toSlug } from '@/lib/utils/slug'
import { US_STATES } from '@/lib/utils/constants'
import { formatCurrency } from '@/lib/utils/formatters'
import { Plus, Trash2, GripVertical, ImagePlus, X, Loader2 } from 'lucide-react'
import type { Category, Product } from '@/lib/types/product'

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title must be 120 characters or less'),
  description: z.string().max(5000).optional(),
  category_id: z.string().uuid('Please select a category'),
  condition: z.enum(['new', 'used']),
  price: z.coerce.number().min(1, 'Price must be at least $1'),
  compare_at_price: z.coerce.number().positive().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(1, 'Stock must be at least 1'),
  state_location: z.string().min(1, 'State is required'),
  video_url: z.string().url().optional().or(z.literal('')),
  shipping_notes: z.string().max(1000).optional(),
})

type ListingFormValues = z.infer<typeof listingSchema>

interface SpecRow { key: string; value: string }

interface ListingFormProps {
  storeId: string
  categories: Category[]
  product?: Product
}

export function ListingForm({ storeId, categories, product }: ListingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!product

  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: product?.title ?? '',
      description: product?.description ?? '',
      category_id: product?.category_id ?? '',
      condition: product?.condition ?? 'new',
      price: product?.price ?? undefined,
      compare_at_price: product?.compare_at_price ?? '',
      stock: product?.stock ?? undefined,
      state_location: product?.state_location ?? 'Texas',
      video_url: product?.video_url ?? '',
      shipping_notes: product?.shipping_notes ?? '',
    },
  })

  const watchedPrice = watch('price')
  const watchedSalePrice = watch('compare_at_price')

  // Image upload via dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = 8 - images.length
    if (remaining <= 0) { notify.error('Maximum 8 images allowed'); return }
    const toUpload = acceptedFiles.slice(0, remaining)
    setUploadingImages(true)
    try {
      const urls = await Promise.all(toUpload.map(f => uploadProductImage(f, storeId)))
      setImages(prev => [...prev, ...urls])
    } catch {
      notify.error('Failed to upload some images. Please try again.')
    }
    setUploadingImages(false)
  }, [images, storeId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    disabled: images.length >= 8,
  })

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))
  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }])
  const removeSpec = (idx: number) => setSpecs(prev => prev.filter((_, i) => i !== idx))
  const updateSpec = (idx: number, field: 'key' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))

  const onSubmit = async (data: ListingFormValues) => {
    if (images.length === 0) { notify.error('Please upload at least one image'); return }
    setSubmitting(true)

    try {
      const slug = toSlug(`${data.title}-${Date.now()}`)
      const payload = {
        store_id: storeId,
        title: data.title,
        slug,
        description: data.description || null,
        category_id: data.category_id,
        condition: data.condition,
        price: data.price,
        compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
        stock: data.stock,
        state_location: data.state_location,
        video_url: data.video_url || null,
        shipping_notes: data.shipping_notes || null,
        images,
        status: 'pending' as const,
        species_ids: [],
      }

      let productId = product?.id

      if (isEdit && productId) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId)
        if (error) throw error
      } else {
        const { data: inserted, error } = await supabase.from('products').insert(payload).select('id').single()
        if (error) throw error
        productId = (inserted as any).id
      }

      // Upsert specs
      if (productId && specs.length > 0) {
        const validSpecs = specs.filter(s => s.key.trim() && s.value.trim())
        if (validSpecs.length > 0) {
          await supabase.from('product_specs').delete().eq('product_id', productId)
          await supabase.from('product_specs').insert(
            validSpecs.map((s, i) => ({
              product_id: productId!,
              key: s.key.trim(),
              value: s.value.trim(),
              sort_order: i,
            }))
          )
        }
      }

      notify.success(isEdit ? 'Listing updated — pending review.' : 'Listing submitted for review!')
      router.push('/store/listings')
      router.refresh()
    } catch (err: any) {
      notify.error(err.message ?? 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">

      {/* Images */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-1">Photos</h2>
        <p className="text-xs text-text-muted mb-4">Upload 1–8 photos. First image is the cover. Max 5 MB each.</p>

        <div className="grid grid-cols-4 gap-3 mb-3">
          {images.map((url, idx) => (
            <div key={url} className="relative aspect-square rounded-card overflow-hidden bg-bg-primary group">
              <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="120px" />
              {idx === 0 && (
                <div className="absolute bottom-0 inset-x-0 text-center bg-black/60 text-[10px] text-accent-cream py-0.5">
                  Cover
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}

          {images.length < 8 && (
            <div
              {...getRootProps()}
              className={`aspect-square rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'border-accent-cream bg-accent-cream/5' : 'border-border hover:border-red-primary'
              } ${uploadingImages ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              {uploadingImages
                ? <Loader2 className="h-5 w-5 text-text-muted animate-spin" />
                : <ImagePlus className="h-5 w-5 text-text-muted" />
              }
              <span className="text-[10px] text-text-muted mt-1">
                {isDragActive ? 'Drop here' : 'Add photo'}
              </span>
            </div>
          )}
        </div>
      </section>

      <Divider />

      {/* Basic info */}
      <section className="space-y-5">
        <h2 className="font-heading text-lg text-text-primary">Details</h2>

        {/* Title */}
        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Title <span className="text-red-primary">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="e.g. Vortex Crossfire HD 10x42 Binoculars"
            maxLength={120}
            className="input-base w-full"
          />
          {errors.title && <p className="text-xs text-red-primary mt-1">{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Category <span className="text-red-primary">*</span>
          </label>
          <select {...register('category_id')} className="input-base w-full">
            <option value="">Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-red-primary mt-1">{errors.category_id.message}</p>}
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Condition <span className="text-red-primary">*</span>
          </label>
          <div className="flex gap-3">
            {(['new', 'used'] as const).map(c => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={c} {...register('condition')} className="accent-red-primary" />
                <span className="text-text-primary capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Describe the item's condition, features, and any other relevant details..."
            className="input-base w-full resize-y"
          />
        </div>
      </section>

      <Divider />

      {/* Pricing & Stock */}
      <section className="space-y-5">
        <h2 className="font-heading text-lg text-text-primary">Pricing & Stock</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Price <span className="text-red-primary">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <input
                {...register('price')}
                type="number"
                min={1}
                step="0.01"
                placeholder="0.00"
                className="input-base w-full pl-7"
              />
            </div>
            {errors.price && <p className="text-xs text-red-primary mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">Sale Price <span className="text-text-muted text-xs">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <input
                {...register('compare_at_price')}
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="input-base w-full pl-7"
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Original price shown as strikethrough</p>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Stock Qty <span className="text-red-primary">*</span>
            </label>
            <input
              {...register('stock')}
              type="number"
              min={1}
              placeholder="1"
              className="input-base w-full"
            />
            {errors.stock && <p className="text-xs text-red-primary mt-1">{errors.stock.message}</p>}
          </div>
        </div>

        {watchedPrice && watchedSalePrice && Number(watchedSalePrice) > 0 && (
          <p className="text-xs text-accent-cream">
            Item will show as on sale: {formatCurrency(watchedPrice)} (was {formatCurrency(Number(watchedSalePrice))})
          </p>
        )}
      </section>

      <Divider />

      {/* Location & Shipping */}
      <section className="space-y-5">
        <h2 className="font-heading text-lg text-text-primary">Location & Shipping</h2>

        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Ship From (State) <span className="text-red-primary">*</span>
          </label>
          <select {...register('state_location')} className="input-base w-full max-w-xs">
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state_location && <p className="text-xs text-red-primary mt-1">{errors.state_location.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1.5">Shipping Notes</label>
          <textarea
            {...register('shipping_notes')}
            rows={3}
            placeholder="e.g. Ships within 2-3 business days via USPS Priority Mail..."
            className="input-base w-full resize-y"
          />
        </div>
      </section>

      <Divider />

      {/* Specifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-text-primary">Specifications</h2>
            <p className="text-xs text-text-muted">Add key-value pairs like Weight, Dimensions, Material, etc.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addSpec}>
            Add Spec
          </Button>
        </div>

        {specs.length > 0 && (
          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <GripVertical className="h-4 w-4 text-text-muted flex-shrink-0" />
                <input
                  value={spec.key}
                  onChange={e => updateSpec(idx, 'key', e.target.value)}
                  placeholder="e.g. Weight"
                  className="input-base flex-1"
                />
                <input
                  value={spec.value}
                  onChange={e => updateSpec(idx, 'value', e.target.value)}
                  placeholder="e.g. 1.5 lbs"
                  className="input-base flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(idx)}
                  className="text-text-muted hover:text-red-primary transition-colors"
                  aria-label="Remove spec"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* Video */}
      <section>
        <h2 className="font-heading text-lg text-text-primary mb-1">Video <span className="text-text-muted text-sm font-body">(optional)</span></h2>
        <input
          {...register('video_url')}
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          className="input-base w-full"
        />
        {errors.video_url && <p className="text-xs text-red-primary mt-1">{errors.video_url.message}</p>}
      </section>

      {/* Notice */}
      <div className="bg-bg-secondary rounded-card p-4 text-xs text-text-muted leading-relaxed">
        Your listing will be submitted as <strong className="text-accent-cream">pending</strong> and reviewed by our team before going live.
        You will be notified once it is approved or if any changes are needed.
      </div>

      {/* Submit */}
      <div className="flex gap-3 pb-8">
        <Button type="submit" variant="primary" size="lg" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Submit for Review'}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.push('/store/listings')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
