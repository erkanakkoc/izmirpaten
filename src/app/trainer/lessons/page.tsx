import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrainerLessons from '@/components/trainer/TrainerLessons'

export const revalidate = 0

export default async function TrainerLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/trainer/login')

  const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/trainer/login')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, students(full_name, email), locations(name), enrollments(package_name, lessons_remaining)')
    .eq('trainer_id', trainer.id)
    .order('scheduled_at', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Dersler</h1>
        <p className="text-gray-500 text-sm mt-1">Ders taleplerini onayla, reddet veya tamamlandı olarak işaretle.</p>
      </div>
      <TrainerLessons lessons={lessons ?? []} />
    </div>
  )
}
