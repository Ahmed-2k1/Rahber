// Shapes of our database rows, mirrored in TypeScript so the editor
// can catch mistakes before they ever run.

export type UserRole = 'super_admin' | 'area_admin' | 'member'
export type BrotherStatus = 'active' | 'moved' | 'unavailable'
export type ResponsibleRole =
  | 'amir'
  | '3days'
  | '40days'
  | '4months'
  | 'alim'
  | 'other'

export interface Profile {
  id: string
  name: string
  phone: string | null
  role: UserRole
  masjid_id: number | null
  is_approved: boolean
  created_at: string
}

export interface Masjid {
  id: number
  name: string
  address: string | null
  area: string | null
  city_id: number | null
  lat: number | null
  lng: number | null
  created_by: string | null
  is_active: boolean
  created_at: string
}

export interface MasjidAamaal {
  masjid_id: number
  has_taleem: boolean
  has_mushwara: boolean
  has_local_jaula: boolean
  has_neighbouring_jaula: boolean
  has_daily_dawah: boolean
  has_monthly_3days: boolean
  updated_at: string
  updated_by: string | null
}

export interface MasjidInfo {
  masjid_id: number
  ulama_count: number
  ulama_spent_4_months: number
  ulama_spent_1_year: number
  lady_taleem_locations: number
  updated_at: string
  updated_by: string | null
}

export interface Brother {
  id: number
  name: string
  address_line: string
  landmark: string | null
  masjid_id: number
  phone: string | null
  notes: string | null
  status: BrotherStatus
  added_by: string | null
  created_at: string
  updated_at: string
}

export interface Visit {
  id: number
  brother_id: number
  visited_by: string | null
  visited_at: string
  notes: string | null
  niyyah_3days: boolean
  niyyah_40days: boolean
  niyyah_4months: boolean
  niyyah_ijtema: boolean
  niyyah_local_gasht: boolean
  created_at: string
}

export interface MasjidResponsible {
  id: number
  masjid_id: number
  brother_id: number
  role: ResponsibleRole
  notes: string | null
  created_at: string
}
