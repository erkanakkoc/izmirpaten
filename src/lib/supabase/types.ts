export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
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
          status: string
          video_consent: boolean
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      packages: {
        Row: {
          id: string
          name: string
          price: number
          description: string | null
          badge: string | null
          is_featured: boolean
          is_active: boolean
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['packages']['Insert']>
      }
      locations: {
        Row: {
          id: string
          name: string
          venue: string
          weekday_hours: string | null
          weekend_hours: string | null
          maps_url: string | null
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      site_settings: {
        Row: { key: string; value: string | null; updated_at: string }
        Insert: { key: string; value?: string | null }
        Update: { value?: string | null; updated_at?: string }
      }
      features: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          sort_order: number
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['features']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['features']['Insert']>
      }
      info_cards: {
        Row: {
          id: string
          title: string
          content: string
          icon: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['info_cards']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['info_cards']['Insert']>
      }
      mail_logs: {
        Row: {
          id: string
          created_at: string
          application_id: string | null
          applicant_name: string | null
          applicant_email: string | null
          subject: string | null
          status: string
        }
        Insert: Omit<Database['public']['Tables']['mail_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mail_logs']['Insert']>
      }
      allowed_emails: {
        Row: { email: string }
        Insert: { email: string }
        Update: { email?: string }
      }
    }
  }
}
