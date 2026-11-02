'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { notify } from '@/components/ui/Notification'
import { formatCurrency } from '@/lib/utils/formatters'
import { Trash2, Plus } from 'lucide-react'

interface Rate {
  id: string
  name: string
  description: string | null
  price: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
}

export function ShippingManager({ initialRates }: { initialRates: Rate[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', estimated_days_min: '5', estimated_days_max: '7' })
  const [loading, setLoading] = useState(false)

  const create = async () => {
    if (!form.name || !form.price) { notify.error('Name and price required'); return }
    setLoading(true)
    const res = await fetch('/api/admin/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        estimated_days_min: parseInt(form.estimated_days_min),
        estimated_days_max: parseInt(form.estimated_days_max),
      }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success('Shipping tier added')
      setForm({ name: '', description: '', price: '', estimated_days_min: '5', estimated_days_max: '7' })
      setAdding(false)
      router.refresh()
    } else notify.error('Failed to add')
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this shipping tier?')) return
    const res = await fetch(`/api/admin/shipping?id=${id}`, { method: 'DELETE' })
    if (res.ok) { notify.success('Deleted'); router.refresh() }
  }

  return (
    <div className="space-y-3">
      {initialRates.map(rate => (
        <div key={rate.id} className="card-base p-4 flex items-center justify-between">
          <div>
            <p className="text-text-primary font-body font-medium">{rate.name}</p>
            <p className="text-text-muted text-sm">{rate.description}</p>
            <p className="text-text-muted text-xs">{rate.estimated_days_min}–{rate.estimated_days_max} business days</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-heading text-lg text-accent-cream">{formatCurrency(rate.price)}</span>
            <button onClick={() => remove(rate.id)} className="text-text-muted hover:text-red-primary transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="card-base p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Tier name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base text-sm" />
            <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-base text-sm" />
          </div>
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base text-sm w-full" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Min days" type="number" value={form.estimated_days_min} onChange={e => setForm(f => ({ ...f, estimated_days_min: e.target.value }))} className="input-base text-sm" />
            <input placeholder="Max days" type="number" value={form.estimated_days_max} onChange={e => setForm(f => ({ ...f, estimated_days_max: e.target.value }))} className="input-base text-sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={loading} onClick={create}>Add Tier</Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
          Add Shipping Tier
        </Button>
      )}
    </div>
  )
}
