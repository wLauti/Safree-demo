import { z } from 'zod'

export const emailSchema = z.string().email('Please enter a valid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive'),
  compare_at_price: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional(),
  species_ids: z.array(z.string().uuid()),
})

export const experienceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  price_per_person: z.number().positive(),
  max_guests: z.number().int().min(1),
  duration_days: z.number().int().min(1).optional(),
  location_name: z.string().optional(),
  location_state: z.string().optional(),
  amenities: z.array(z.string()),
  species_ids: z.array(z.string().uuid()),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
