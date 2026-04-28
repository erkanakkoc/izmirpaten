import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/student/StudentSidebar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/student/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/student/login?error=notfound')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
