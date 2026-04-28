import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookLesson from '@/components/student/BookLesson'

export const revalidate = 0

export default async function StudentBookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/student/login')

  const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single()
  if (!student) redirect('/student/login')

  const [enrollmentRes, availRes, locationsRes] = await Promise.all([
    supabase.from('enrollments').select('*, trainers(id, name)').eq('student_id', student.id).eq('is_active', true).single(),
    supabase.from('trainer_availability').select('*, trainers(id, name), locations(id, name)').eq('is_active', true),
    supabase.from('locations').select('*').eq('is_active', true),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Ders Al</h1>
        <p className="text-gray-500 text-sm mt-1">Eğitmeninizin müsait olduğu zaman dilimlerinden ders seçin.</p>
      </div>
      <BookLesson
        studentId={student.id}
        enrollment={enrollmentRes.data}
        availability={availRes.data ?? []}
        locations={locationsRes.data ?? []}
      />
    </div>
  )
}
