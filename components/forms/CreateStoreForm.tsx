'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { useState } from 'react'
import { Store, MapPin } from 'lucide-react'

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
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().max(500).optional(),
  subtype: z.enum(['store', 'coto']),
  location_state: z.string().optional(),
  location_city: z.string().max(80).optional(),
})

type FormValues = z.infer<typeof schema>

export function CreateStoreForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subtype: 'store' },
  })

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      setFormError(json.error ?? 'Something went wrong')
      notify.error(json.error ?? 'Failed to create store')
      return
    }
    notify.success('Store created!')
    window.location.href = '/store'
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {formError && (
        <div className="p-3 rounded-card bg-red-primary/10 border border-red-primary text-red-primary text-sm">
          {formError}
        </div>
      )}

      {/* Store type */}
      <div>
        <p className="text-label text-text-muted mb-3">Store type</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'store', label: 'Gear Store', desc: 'Sell hunting & fishing products' },
            { value: 'coto', label: 'Coto / Ranch', desc: 'Offer experiences & bookings' },
          ].map(opt => (
            <label key={opt.value} className="relative cursor-pointer">
              <input type="radio" value={opt.value} {...register('subtype')} className="sr-only peer" />
              <div className="p-4 rounded-card border border-border peer-checked:border-red-primary peer-checked:bg-red-primary/5 transition-colors">
                <p className="font-heading text-sm text-text-primary">{opt.label}</p>
                <p className="text-xs text-text-muted mt-1">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Input
        label="Store Name"
        placeholder="e.g. Rio Grande Outfitters"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Description */}
      <div className="w-full">
        <label className="block text-label text-text-muted mb-1.5">Description <span className="text-text-muted/60">(optional)</span></label>
        <textarea
          rows={3}
          placeholder="Tell buyers about your store..."
          className="input-base resize-none w-full"
          {...register('description')}
        />
        {errors.description && <p className="mt-1 text-xs text-red-primary">{errors.description.message}</p>}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <div className="w-full">
          <label className="block text-label text-text-muted mb-1.5">State <span className="text-text-muted/60">(optional)</span></label>
          <select className="input-base appearance-none w-full" {...register('location_state')}>
            <option value="">— Select state —</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Input
          label="City (optional)"
          placeholder="e.g. San Antonio"
          error={errors.location_city?.message}
          {...register('location_city')}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
        <Store className="h-4 w-4" />
        Create My Store
      </Button>
    </form>
  )
}
