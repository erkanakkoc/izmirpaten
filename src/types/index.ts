export type ApplicationStatus = 'new' | 'reviewed' | 'approved' | 'rejected'

export interface Package {
  id: string
  name: string
  price: number
  description: string | null
  badge: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
}

export interface Location {
  id: string
  name: string
  venue: string
  weekday_hours: string | null
  weekend_hours: string | null
  maps_url: string | null
  is_active: boolean
}

export interface Application {
  id: string
  created_at: string
  full_name: string
  phone: string
  email: string | null
  age: number | null
  is_for_self: boolean
  student_name: string | null
  student_age: number | null
  package_id: string | null
  package_name: string
  location_id: string | null
  location_name: string
  available_days: string[] | null
  available_hours: string | null
  notes: string | null
  status: ApplicationStatus
  video_consent: boolean
}

export interface Feature {
  id: string
  title: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
}

export interface InfoCard {
  id: string
  title: string
  content: string
  icon: string | null
  sort_order: number
}

export interface SiteSetting {
  key: string
  value: string | null
  updated_at: string
}

export interface MailLog {
  id: string
  created_at: string
  application_id: string | null
  applicant_name: string | null
  applicant_email: string | null
  subject: string | null
  status: string
}

export interface SiteSettings {
  site_title?: string
  site_slogan?: string
  logo_url?: string
  logo_display_mode?: 'logo_only' | 'logo_and_title' | 'title_only'
  logo_height?: string
  hero_title?: string
  hero_subtitle?: string
  hero_cta_text?: string
  about_text?: string
  footer_slogan?: string
  footer_copyright?: string
  footer_links?: string
  instagram_url?: string
  instagram_show_section?: string
  whatsapp_number?: string
  admin_email_template?: string
  show_reviews?: string
  show_gallery?: string
  group_prerequisite_note?: string
}

export interface Review {
  id: string
  created_at: string
  name: string
  rating: number
  comment: string
  package_name: string | null
  is_approved: boolean
}

export interface GalleryImage {
  id: string
  url: string
  alt: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}
