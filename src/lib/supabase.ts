import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Pediatrician = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  practice_name: string | null
  specialty: string
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  insurance_accepted: string[] | null
  languages: string[] | null
  rating: number
  review_count: number
  accepting_new_patients: boolean
  bio: string | null
  image_url: string | null
}
