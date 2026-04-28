import { createClient } from './supabase/server'

export interface AdminPermissions {
  locationFilter: string | null
}

export async function getAdminPermissions(): Promise<AdminPermissions> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { locationFilter: null }

  const { data } = await supabase
    .from('allowed_emails')
    .select('location_filter')
    .eq('email', user.email)
    .single()

  return {
    locationFilter: (data as { location_filter?: string | null } | null)?.location_filter ?? null,
  }
}
