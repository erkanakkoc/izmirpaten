import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/student/StudentSidebar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/student/login')

    const { data: student, error } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single()

    if (error || !student) {
      redirect('/student/login?error=notfound')
    }

    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <StudentSidebar studentName={student.full_name} />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    )
  } catch {
    redirect('/student/login')
  }
}
