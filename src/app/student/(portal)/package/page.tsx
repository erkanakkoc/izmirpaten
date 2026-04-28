import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackageRenewal from '@/components/student/PackageRenewal'

export const revalidate = 0

export default async function StudentPackagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/student/login')

  const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single()
  if (!student) redirect('/student/login')

  const [enrollmentRes, packagesRes, paymentRes] = await Promise.all([
    supabase.from('enrollments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
    supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('payment_requests').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Paketim</h1>
      </div>
      <PackageRenewal
        studentId={student.id}
        enrollments={enrollmentRes.data ?? []}
        packages={packagesRes.data ?? []}
        paymentRequests={paymentRes.data ?? []}
      />
    </div>
  )
}
