export type UserRole = 'admin' | 'moderator' | 'store' | 'user'
export type StoreSubtype = 'store' | 'coto'
export type ListingStatus = 'pending' | 'active' | 'rejected' | 'archived'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'refunded' | 'cancelled'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'disputed' | 'refunded' | 'cancelled'
export type DisputeStatus = 'open' | 'under_review' | 'resolved_refund' | 'resolved_no_refund' | 'closed'
export type DisputeRefType = 'order' | 'booking'
export type NotificationType =
  | 'listing_approved'
  | 'listing_rejected'
  | 'new_order'
  | 'new_booking'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'funds_released'
  | 'verification_approved'
  | 'review_received'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          email_verified: boolean
          phone: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          subtype: StoreSubtype
          logo_url: string | null
          banner_url: string | null
          location_state: string | null
          location_city: string | null
          location_coords: unknown | null
          stripe_account_id: string | null
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stores']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['stores']['Insert']>
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          title: string
          description: string | null
          price: number
          compare_at_price: number | null
          images: string[]
          stock: number
          sku: string | null
          status: ListingStatus
          species_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      experiences: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          title: string
          description: string | null
          price_per_person: number
          max_guests: number
          images: string[]
          location_name: string | null
          location_state: string | null
          location_coords: unknown | null
          duration_days: number | null
          status: ListingStatus
          species_ids: string[]
          amenities: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['experiences']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['experiences']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          type: 'product' | 'experience'
          icon_url: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], never>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      species: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'game' | 'fish' | 'bird'
          image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['species']['Row'], never>
        Update: Partial<Database['public']['Tables']['species']['Insert']>
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          store_id: string
          items: Record<string, unknown>[]
          subtotal: number
          tax: number
          total: number
          status: OrderStatus
          stripe_payment_intent_id: string | null
          shipping_address: Record<string, unknown> | null
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          experience_id: string
          store_id: string
          guests: number
          start_date: string
          end_date: string
          total: number
          status: BookingStatus
          stripe_payment_intent_id: string | null
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      disputes: {
        Row: {
          id: string
          ref_type: DisputeRefType
          ref_id: string
          opened_by_user_id: string
          store_id: string
          reason: string
          status: DisputeStatus
          resolution_note: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['disputes']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['disputes']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          ref_type: DisputeRefType
          ref_id: string
          user_id: string
          rating: number
          body: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      integration_keys: {
        Row: {
          id: string
          service: string
          key_encrypted: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['integration_keys']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['integration_keys']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string
          actor_role: UserRole
          action: string
          target_type: string
          target_id: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'created_at'> & { created_at?: string }
        Update: never
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string | null
          ref_type: string | null
          ref_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      store_subtype: StoreSubtype
      listing_status: ListingStatus
      order_status: OrderStatus
      booking_status: BookingStatus
      dispute_status: DisputeStatus
      dispute_ref_type: DisputeRefType
      notification_type: NotificationType
    }
  }
}
