import { z } from 'zod'

// Shared Zod schemas for API request bodies.

export const reviewSchema = z.object({
  ref_type: z.enum(['order', 'booking']),
  ref_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional().nullable(),
  anonymous: z.boolean().optional(),
})

export const disputeOpenSchema = z.object({
  ref_type: z.enum(['order', 'booking']),
  ref_id: z.string().uuid(),
  reason_category: z.string().min(1).max(100),
  description: z.string().min(50).max(2000),
  evidence_urls: z.array(z.string().url()).max(5).optional(),
})

export const disputeRespondSchema = z.object({
  response: z.string().min(50).max(2000),
  evidence_urls: z.array(z.string().url()).max(5).optional(),
})

export const disputeResolveSchema = z.object({
  resolution_type: z.enum(['full_refund', 'partial_refund', 'no_refund']),
  refund_amount: z.number().positive().optional(),
  note: z.string().max(1000).optional(),
})

export const contentFlagSchema = z.object({
  ref_type: z.enum(['product', 'experience', 'review']),
  ref_id: z.string().uuid(),
  reason: z.string().min(1).max(100),
  details: z.string().max(1000).optional().nullable(),
})

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }).optional(),
  }).passthrough(),
})

export const accountDeleteSchema = z.object({
  confirm: z.literal('DELETE'),
})

export const consentSchema = z.object({
  analytics: z.boolean(),
  functional: z.boolean(),
})
