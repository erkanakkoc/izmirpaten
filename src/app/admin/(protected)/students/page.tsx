import { createClient } from '@/lib/supabase/server'
import { getAdminPermissions } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import StudentsManager from '@/components/admin/StudentsManager'

export const revalidate = 0

export default async function StudentsPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()
  const [studentsRes, trainersRes, packagesRes, enrollmentsRes, lessonsRes, changesRes, requestsRes] = await Promise.all([
    supabase.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('trainers').select('id, name').eq('is_active', true),
    supabase.from('packages').select('id, name, price').eq('is_active', true).order('sort_order'),
    supabase.from('enrollments').select('*').eq('is_active', true),
    supabase.from('lessons').select('*, trainers(name)').in('status', ['pending', 'approved', 'completed']),
    supabase.from('trainer_changes').select('*').order('created_at', { ascending: false }),
    supabase.from('trainer_change_requests').select('*, students(full_name)').eq('status', 'pending').order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Öğrenciler</h1>
        <p className="text-gray-500 text-sm mt-1">Öğrenci kayıtları, ders takibi ve hesap yönetimi.</p>
      </div>
      <StudentsManager
        students={studentsRes.data ?? []}
        trainers={trainersRes.data ?? []}
        packages={packagesRes.data ?? []}
        enrollments={enrollmentsRes.data ?? []}
        lessons={lessonsRes.data ?? []}
        trainerChanges={changesRes.data ?? []}
        pendingRequests={requestsRes.data ?? []}
      />
    </div>
  )
}
