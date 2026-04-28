import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { reason } = await req.json()

  const service = await createServiceClient()

  const { data: student } = await service.from('students').select('id, full_name').eq('user_id', user.id).single()
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 403 })

  const { data: enrollment } = await service.from('enrollments').select('id, trainer_id').eq('student_id', student.id).eq('is_active', true).single()
  if (!enrollment) return NextResponse.json({ error: 'Aktif kayıt bulunamadı.' }, { status: 400 })

  // Bekleyen talep var mı?
  const { data: existing } = await service.from('trainer_change_requests').select('id').eq('student_id', student.id).eq('status', 'pending').single()
  if (existing) return NextResponse.json({ error: 'Zaten bekleyen bir değişiklik talebiniz var.' }, { status: 409 })

  const { error } = await service.from('trainer_change_requests').insert({
    student_id: student.id,
    enrollment_id: enrollment.id,
    current_trainer_id: enrollment.trainer_id,
    reason: reason || null,
    status: 'pending',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await service.from('notifications').insert({
    type: 'trainer_change_request',
    target_role: 'admin',
    title: 'Eğitmen değişiklik talebi',
    message: `${student.full_name} eğitmen değişikliği talep etti.`,
    link: '/admin/students',
  })

  return NextResponse.json({ success: true })
}
