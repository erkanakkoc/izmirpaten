import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { student_id } = await req.json()
  if (!student_id) return NextResponse.json({ error: 'student_id zorunlu.' }, { status: 400 })

  const service = await createServiceClient()

  const { data: student } = await service.from('students').select('user_id, full_name').eq('id', student_id).single()
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 })

  // Cascade: lessons → enrollments → payment_requests → trainer_change_requests → students
  // ON DELETE CASCADE ile çoğu otomatik silinir, yine de sıralı silelim
  await service.from('lessons').delete().eq('student_id', student_id)
  await service.from('payment_requests').delete().eq('student_id', student_id)
  await service.from('trainer_change_requests').delete().eq('student_id', student_id)
  await service.from('trainer_changes').delete().eq('student_id', student_id)
  await service.from('enrollments').delete().eq('student_id', student_id)
  await service.from('students').delete().eq('id', student_id)

  if (student.user_id) {
    await service.auth.admin.deleteUser(student.user_id)
  }

  return NextResponse.json({ success: true })
}
