import { createClient } from '@/lib/supabase/server'
import { getAdminPermissions } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import TrainersManager from '@/components/admin/TrainersManager'

export const revalidate = 0

export default async function TrainersPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()
  const [trainersRes, locationsRes] = await Promise.all([
    supabase.from('trainers').select('*').order('created_at'),
    supabase.from('locations').select('*').eq('is_active', true),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Eğitmenler</h1>
        <p className="text-gray-500 text-sm mt-1">Eğitmenleri yönet, müsaitliklerini görüntüle.</p>
      </div>
      <TrainersManager trainers={trainersRes.data ?? []} locations={locationsRes.data ?? []} />
    </div>
  )
}
