export type Listing = {
  id: string
  host_id: string
  title: string
  description: string
  address: string
  price_per_night: number
  max_guests: number
  bedrooms: number
  beds: number
  baths: number
  image_urls: string[]
  is_published: boolean
  created_at: string
}

export type Booking = {
  id: string
  listing_id: string
  guest_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export type BookedRange = {
  check_in: string
  check_out: string
}

export type ActionState = { error: string | null }
