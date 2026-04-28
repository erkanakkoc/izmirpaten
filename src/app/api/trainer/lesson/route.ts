import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { lesson_id, action, trainer_note } = await req.json()

  const service = await createServiceClient()

  // Trainer kimliğini bul
  const { data: trainer } = await service.from('trainers').select('id, name').eq('user_id', user.id).single()
  if (!trainer) return NextResponse.json({ error: 'Eğitmen bulunamadı.' }, { status: 403 })

  const { data: lesson } = await service.from('lessons').select('*, students(full_name)').eq('id', lesson_id).eq('trainer_id', trainer.id).single()
  if (!lesson) return NextResponse.json({ error: 'Ders bulunamadı.' }, { status: 404 })

  if (action === 'approve') {
    await service.from('lessons').update({ status: 'approved', trainer_note: trainer_note || null }).eq('id', lesson_id)

    await service.from('notifications').insert({
      type: 'lesson_approved', target_role: 'student',
      target_user_id: lesson.student_id,
      title: 'Dersiniz onaylandı! ✅',
      message: `${trainer.name} dersinizi onayladı.`,
      link: '/student',
    })
  } else if (action === 'reject') {
    await service.from('lessons').update({ status: 'cancelled', trainer_note: trainer_note || null }).eq('id', lesson_id)

    await service.from('notifications').insert({
      type: 'lesson_rejected', target_role: 'student',
      target_user_id: lesson.student_id,
      title: 'Ders talebi reddedildi',
      message: trainer_note || 'Bu zaman dilimi uygun değil, lütfen başka bir zaman seçin.',
      link: '/student/book',
    })
  } else if (action === 'complete') {
    await service.from('lessons').update({ status: 'completed' }).eq('id', lesson_id)
    // Ders hakkını azalt
    const { data: enrollment } = await service.from('enrollments').select('id, lessons_remaining').eq('id', lesson.enrollment_id).single()
    if (enrollment && enrollment.lessons_remaining > 0) {
      await service.from('enrollments').update({ lessons_remaining: enrollment.lessons_remaining - 1 }).eq('id', enrollment.id)

      // 1 ders kaldıysa bildirim
      if (enrollment.lessons_remaining - 1 === 1) {
        await service.from('notifications').insert({
          type: 'package_expiring', target_role: 'student',
          target_user_id: lesson.student_id,
          title: '⚠️ Son 1 ders hakkınız kaldı!',
          message: 'Paketinizi yenilemek ister misiniz?',
          link: '/student/package',
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
