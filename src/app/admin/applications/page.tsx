import { createClient } from '@/lib/supabase/server'
import ApplicationsClient from '@/components/admin/ApplicationsTable'

export const revalidate = 0

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const [appsRes, packagesRes, locationsRes] = await Promise.all([
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
    supabase.from('packages').select('id, name').order('sort_order'),
    supabase.from('locations').select('id, name'),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Başvurular</h1>
        <p className="text-gray-500 text-sm mt-1">Tüm başvuruları yönet, filtrele ve güncelle.</p>
      </div>
      <ApplicationsClient
        initialApplications={appsRes.data ?? []}
        packages={packagesRes.data ?? []}
        locations={locationsRes.data ?? []}
      />
    </div>
  )
}
