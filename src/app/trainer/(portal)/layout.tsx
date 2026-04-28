import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrainerSidebar from '@/components/trainer/TrainerSidebar'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/trainer/login')

    const { data: trainer, error } = await supabase
      .from('trainers')
      .select('id, name, is_active')
      .eq('user_id', user.id)
      .single()

    if (error || !trainer || !trainer.is_active) {
      redirect('/trainer/login?error=unauthorized')
    }

    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <TrainerSidebar trainerName={trainer.name} />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    )
  } catch {
    redirect('/trainer/login')
  }
}
