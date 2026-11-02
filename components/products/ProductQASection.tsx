'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { notify } from '@/components/ui/Notification'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProductQA } from '@/lib/types/product'

interface ProductQASectionProps {
  productId: string
  initialQA: ProductQA[]
}

export function ProductQASection({ productId, initialQA }: ProductQASectionProps) {
  const { user } = useAuth()
  const [qaList, setQaList] = useState(initialQA)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !question.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('product_qa')
      .insert({ product_id: productId, asked_by: user.id, question: question.trim() } as never)
      .select('*')
      .single()
    if (error) {
      notify.error('Failed to submit question')
    } else {
      notify.success('Question submitted — the seller will be notified')
      setQaList(prev => [data as unknown as ProductQA, ...prev])
      setQuestion('')
      setShowForm(false)
    }
    setSubmitting(false)
  }

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-5">
      {/* Ask form */}
      {user ? (
        <div>
          {!showForm ? (
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}
              leftIcon={<MessageCircle className="h-4 w-4" />}>
              Ask a Question
            </Button>
          ) : (
            <form onSubmit={handleAsk} className="card-base p-4 space-y-3">
              <Textarea
                label="Your question"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Ask about this product…"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!question.trim()}>
                  Submit Question
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          <a href="/login" className="text-accent-cream underline">Sign in</a> to ask a question.
        </p>
      )}

      {/* Q&A list */}
      {qaList.length === 0 ? (
        <EmptyState
          icon={<MessageCircle />}
          title="No questions yet"
          description="Be the first to ask a question about this product."
        />
      ) : (
        <div className="space-y-3">
          {qaList.map(qa => (
            <div key={qa.id} className="card-base p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  src={qa.asker?.avatar_url}
                  name={qa.asker?.full_name ?? 'User'}
                  size="xs"
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">{formatRelativeDate(qa.created_at)}</p>
                    {qa.answer && (
                      <button onClick={() => toggleExpand(qa.id)} className="text-xs text-red-primary flex items-center gap-0.5">
                        {expanded.has(qa.id) ? <><ChevronUp className="h-3 w-3" /> Hide answer</> : <><ChevronDown className="h-3 w-3" /> Show answer</>}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text-primary mt-1">Q: {qa.question}</p>
                  {qa.answer && expanded.has(qa.id) && (
                    <div className="mt-2 pl-3 border-l-2 border-red-primary">
                      <p className="text-xs text-text-muted mb-0.5">Seller&apos;s answer</p>
                      <p className="text-sm text-accent-cream">{qa.answer}</p>
                    </div>
                  )}
                  {!qa.answer && (
                    <p className="text-xs text-text-muted mt-1 italic">Awaiting seller response</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
