export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils/formatters'
import { Mountain, Plus, Calendar, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Experiences — Safree' }

function statusVariant(s: string): 'verified' | 'pending' | 'default' {
  if (s === 'active') return 'verified'
  if (s === 'rejected' || s === 'archived') return 'pending'
  return 'default'
}

export default async function StoreExperiencesPage() {
  const profile = await requireRole(['admin', 'store'])
  const supabase = createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, subtype')
    .eq('owner_id', profile.id)
    .single()
  const s = store as any

  const { data: expRaw } = await supabase
    .from('experiences')
    .select('id, slug, title, type, status, price_per_person, images, location_state, location_city, avg_rating, review_count, created_at')
    .eq('store_id', s?.id)
    .order('created_at', { ascending: false })

  const experiences = (expRaw ?? []) as any[]

  return (
    <PageWrapper>
      <div className="py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-h1 text-text-primary">My Experiences</h1>
          <Link href="/store/experiences/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create Experience
            </Button>
          </Link>
        </div>
        <p className="text-text-muted mb-6">{s?.name}</p>
        <Divider />

        <div className="mt-6">
          {experiences.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<Mountain />}
                title="No experiences yet"
                description="Create your first hunting or fishing experience listing."
                action={{ label: 'Create Experience', href: '/store/experiences/new' }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {experiences.map(exp => (
                <div key={exp.id} className="card-base flex gap-4 p-4 items-center">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-16 rounded-card overflow-hidden bg-bg-secondary flex-shrink-0">
                    {exp.images?.[0]
                      ? <Image src={exp.images[0]} alt={exp.title} fill className="object-cover" sizes="80px" />
                      : <Mountain className="h-6 w-6 text-text-muted m-auto" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-heading text-text-primary text-base truncate">{exp.title}</p>
                      <Badge variant={statusVariant(exp.status)}>{exp.status}</Badge>
                      {exp.type && (
                        <Badge variant={exp.type === 'fishing' ? 'default' : 'sale'}>{exp.type}</Badge>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">
                      {[exp.location_city, exp.location_state].filter(Boolean).join(', ')}
                      {' · '}
                      {formatCurrency(exp.price_per_person)}/person
                    </p>
                    {exp.review_count > 0 && (
                      <p className="text-text-muted text-xs">
                        ★ {exp.avg_rating?.toFixed(1)} ({exp.review_count} reviews)
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/store/availability/${exp.id}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />}>
                        Availability
                      </Button>
                    </Link>
                    <Link href={`/store/experiences/${exp.id}/edit`}>
                      <Button variant="ghost" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
