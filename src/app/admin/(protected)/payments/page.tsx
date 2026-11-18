import { createClient } from '@/lib/supabase/server'
import { getAdminPermissions } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import PaymentsManager from '@/components/admin/PaymentsManager'

export const revalidate = 0

export default async function PaymentsPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()
  const [paymentsRes, trainersRes, trainerDisciplinesRes, disciplinesRes] = await Promise.all([
    supabase.from('payment_requests').select('*, students(full_name, email), packages(discipline_id)').order('created_at', { ascending: false }),
    supabase.from('trainers').select('id, name').eq('is_active', true),
    supabase.from('trainer_disciplines').select('*'),
    supabase.from('disciplines').select('id, name'),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Ödemeler</h1>
        <p className="text-gray-500 text-sm mt-1">Ödeme taleplerini onayla veya reddet.</p>
      </div>
      <PaymentsManager
        payments={paymentsRes.data ?? []}
        trainers={trainersRes.data ?? []}
        trainerDisciplines={trainerDisciplinesRes.data ?? []}
        disciplines={disciplinesRes.data ?? []}
      />
    </div>
  )
}
