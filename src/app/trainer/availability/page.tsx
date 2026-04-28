import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityManager from '@/components/trainer/AvailabilityManager'

export const revalidate = 0

export default async function TrainerAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/trainer/login')

  const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/trainer/login')

  const [availRes, locationsRes] = await Promise.all([
    supabase.from('trainer_availability').select('*').eq('trainer_id', trainer.id).order('day_of_week'),
    supabase.from('locations').select('*').eq('is_active', true),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Müsaitlik Takvimi</h1>
        <p className="text-gray-500 text-sm mt-1">Hangi gün ve saatlerde ders verebileceğini belirt.</p>
      </div>
      <AvailabilityManager trainerId={trainer.id} availability={availRes.data ?? []} locations={locationsRes.data ?? []} />
    </div>
  )
}
