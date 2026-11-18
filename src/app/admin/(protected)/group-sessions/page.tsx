import { createClient } from '@/lib/supabase/server'
import { getAdminPermissions } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import GroupSessionsManager from '@/components/admin/GroupSessionsManager'

export const revalidate = 0

export default async function GroupSessionsPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()
  const [sessionsRes, disciplinesRes, locationsRes, locationDisciplinesRes, trainersRes, trainerDisciplinesRes, applicationsRes, participantsRes] = await Promise.all([
    supabase.from('group_sessions').select('*, locations(name, venue), trainers(name)').order('session_date', { ascending: false }),
    supabase.from('disciplines').select('*').order('sort_order'),
    supabase.from('locations').select('*').eq('is_active', true),
    supabase.from('location_disciplines').select('*'),
    supabase.from('trainers').select('*').eq('is_active', true),
    supabase.from('trainer_disciplines').select('*'),
    supabase.from('applications').select('*').not('group_session_id', 'is', null),
    supabase.from('group_session_participants').select('*'),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Grup Dersleri</h1>
        <p className="text-gray-500 text-sm mt-1">
          Grup oturumu aç, başvuruları onayla, eğitmen ata.
        </p>
      </div>
      <GroupSessionsManager
        sessions={sessionsRes.data ?? []}
        disciplines={disciplinesRes.data ?? []}
        locations={locationsRes.data ?? []}
        locationDisciplines={locationDisciplinesRes.data ?? []}
        trainers={trainersRes.data ?? []}
        trainerDisciplines={trainerDisciplinesRes.data ?? []}
        applications={applicationsRes.data ?? []}
        participants={participantsRes.data ?? []}
      />
    </div>
  )
}
