import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function TrainerStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/trainer/login')

  const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/trainer/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, students(full_name, email, phone)')
    .eq('trainer_id', trainer.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Öğrencilerim</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {enrollments?.map(e => {
            const student = e.students as { full_name: string; email: string; phone: string | null } | null
            return (
              <div key={e.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 font-bold text-[#FF6B35]">
                  {student?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1B2A4A]">{student?.full_name}</div>
                  <div className="text-xs text-gray-400">{student?.email}{student?.phone ? ` • ${student.phone}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{e.package_name}</div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className={`text-xl font-extrabold ${e.lessons_remaining <= 1 ? 'text-red-500' : 'text-[#FF6B35]'}`}>{e.lessons_remaining}</div>
                  <div className="text-xs text-gray-400">kalan ders</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${e.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {e.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            )
          })}
          {(!enrollments || enrollments.length === 0) && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz öğrenci yok.</div>
          )}
        </div>
      </div>
    </div>
  )
}
