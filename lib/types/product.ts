export interface Category {
  id: string
  name: string
  slug: string
  type: 'product' | 'experience'
  sort_order: number
  icon_url: string | null
}

export interface ProductSpec {
  id: string
  product_id: string
  key: string
  value: string
  sort_order: number
}

export interface ProductQA {
  id: string
  product_id: string
  asked_by: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string
  asker?: { full_name: string | null; avatar_url: string | null }
  answerer?: { full_name: string | null } | null
}

export interface ProductReview {
  id: string
  ref_type: 'order'
  ref_id: string
  user_id: string
  rating: number
  body: string | null
  created_at: string
  reviewer?: { full_name: string | null; avatar_url: string | null }
}

export interface StoreInfo {
  id: string
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  location_state: string | null
  location_city: string | null
  is_verified: boolean
  subtype: 'store' | 'coto'
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  store_id: string
  category_id: string | null
  title: string
  slug: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  images: string[]
  stock: number
  sku: string | null
  condition: 'new' | 'used'
  state_location: string | null
  video_url: string | null
  shipping_notes: string | null
  views: number
  status: 'pending' | 'active' | 'rejected' | 'archived'
  rejection_reason: string | null
  species_ids: string[]
  created_at: string
  updated_at: string
  // Joined
  stores?: StoreInfo
  categories?: Category | null
  specs?: ProductSpec[]
  avg_rating?: number
  review_count?: number
}

export interface SavedItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'top_rated'
export type ConditionFilter = 'all' | 'new' | 'used'

export interface ProductFilters {
  category_slug?: string
  price_min?: number
  price_max?: number
  condition?: ConditionFilter
  state?: string
  min_rating?: number
  on_sale?: boolean
  sort?: SortOption
  page?: number
  q?: string
}
