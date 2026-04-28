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

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Müsaitlik Takvimi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Takvimde bir güne tıkla → saat saat müsaitliğini belirle. Yeşil = müsait, Kırmızı = rezerve.
        </p>
      </div>
      <AvailabilityManager trainerId={trainer.id} />
    </div>
  )
}
