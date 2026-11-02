// Minimal shared shapes for the mobile screens (subset of the web types).

export interface Product {
  id: string
  slug: string | null
  title: string
  price: number
  compare_at_price: number | null
  images: string[]
  stock: number
  location_state: string | null
  stores: { name: string } | null
}

export interface Experience {
  id: string
  slug: string | null
  title: string
  type: 'hunt' | 'fishing' | null
  price_per_person: number
  images: string[]
  location_state: string | null
  location_city: string | null
  avg_rating: number
  review_count: number
  location_coords: { coordinates: [number, number] } | null
  stores: { name: string; is_verified: boolean } | null
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)
}
