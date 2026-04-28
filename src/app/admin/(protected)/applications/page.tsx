import { createClient } from '@/lib/supabase/server'
import ApplicationsClient from '@/components/admin/ApplicationsTable'

export const revalidate = 0

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Kullanıcının lokasyon kısıtını kontrol et
  const { data: allowedEmail } = await supabase
    .from('allowed_emails')
    .select('email, location_filter')
    .eq('email', user?.email ?? '')
    .single()

  const locationFilter = (allowedEmail as { location_filter?: string | null } | null)?.location_filter ?? null

  // location_filter varsa sadece o lokasyona ait başvuruları çek
  let appsQuery = supabase.from('applications').select('*').order('created_at', { ascending: false })
  if (locationFilter) {
    appsQuery = appsQuery.eq('location_name', locationFilter)
  }

  const [appsRes, packagesRes, locationsRes] = await Promise.all([
    appsQuery,
    supabase.from('packages').select('id, name').order('sort_order'),
    locationFilter
      ? supabase.from('locations').select('id, name').eq('name', locationFilter)
      : supabase.from('locations').select('id, name'),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Başvurular</h1>
        <p className="text-gray-500 text-sm mt-1">
          {locationFilter
            ? `${locationFilter} lokasyonuna ait başvurular`
            : 'Tüm başvuruları yönet, filtrele ve güncelle.'}
        </p>
      </div>
      <ApplicationsClient
        initialApplications={appsRes.data ?? []}
        packages={packagesRes.data ?? []}
        locations={locationsRes.data ?? []}
      />
    </div>
  )
}
