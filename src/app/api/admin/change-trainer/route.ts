import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { enrollment_id, new_trainer_id, reason, request_id } = await req.json()
  if (!enrollment_id || !new_trainer_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

  const service = await createServiceClient()

  const { data: enrollment } = await service.from('enrollments').select('*, trainers(name)').eq('id', enrollment_id).single()
  if (!enrollment) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })

  const { data: newTrainer } = await service.from('trainers').select('name').eq('id', new_trainer_id).single()
  if (!newTrainer) return NextResponse.json({ error: 'Yeni eğitmen bulunamadı.' }, { status: 404 })

  const oldTrainerId = enrollment.trainer_id
  const oldTrainerName = (enrollment.trainers as { name: string } | null)?.name ?? null

  // Enrollment güncelle
  await service.from('enrollments').update({ trainer_id: new_trainer_id }).eq('id', enrollment_id)

  // Değişikliği logla
  await service.from('trainer_changes').insert({
    enrollment_id,
    student_id: enrollment.student_id,
    old_trainer_id: oldTrainerId,
    old_trainer_name: oldTrainerName,
    new_trainer_id,
    new_trainer_name: newTrainer.name,
    changed_by: 'admin',
    reason: reason || null,
  })

  // Varsa değişiklik talebini onayla
  if (request_id) {
    await service.from('trainer_change_requests').update({ status: 'approved' }).eq('id', request_id)
  }

  // Öğrenciye bildirim
  await service.from('notifications').insert({
    type: 'trainer_changed',
    target_role: 'student',
    target_user_id: enrollment.student_id,
    title: 'Eğitmeniniz değiştirildi',
    message: `Yeni eğitmeniniz: ${newTrainer.name}`,
    link: '/student',
  })

  return NextResponse.json({ success: true })
}
