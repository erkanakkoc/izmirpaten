import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { enrollment_id, trainer_id, location_id, scheduled_at, student_note } = await req.json()
  if (!scheduled_at || !trainer_id) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

  const service = await createServiceClient()

  const { data: student } = await service.from('students').select('id, full_name').eq('user_id', user.id).single()
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 403 })

  const { data: enrollment } = await service.from('enrollments').select('*').eq('id', enrollment_id).eq('student_id', student.id).eq('is_active', true).single()
  if (!enrollment) return NextResponse.json({ error: 'Aktif kayıt bulunamadı.' }, { status: 403 })
  if (enrollment.lessons_remaining <= 0) return NextResponse.json({ error: 'Ders hakkınız kalmamış.' }, { status: 400 })

  // Aynı saatte çakışma kontrolü
  const slotStart = new Date(scheduled_at)
  const slotEnd = new Date(slotStart.getTime() + 40 * 60 * 1000)
  const { data: conflict } = await service.from('lessons')
    .select('id')
    .eq('trainer_id', trainer_id)
    .in('status', ['pending', 'approved'])
    .gte('scheduled_at', slotStart.toISOString())
    .lt('scheduled_at', slotEnd.toISOString())
    .single()
  if (conflict) return NextResponse.json({ error: 'Bu zaman dilimi dolu.' }, { status: 409 })

  const { data: lesson, error } = await service.from('lessons').insert({
    enrollment_id, trainer_id, student_id: student.id,
    location_id: location_id || null, scheduled_at,
    status: 'pending', student_note: student_note || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Eğitmene bildirim
  const { data: trainer } = await service.from('trainers').select('user_id').eq('id', trainer_id).single()
  await service.from('notifications').insert({
    type: 'lesson_request', target_role: 'trainer',
    target_user_id: trainer?.user_id ?? null,
    title: 'Yeni ders talebi',
    message: `${student.full_name} ders rezervasyonu yaptı.`,
    link: '/trainer/lessons',
    data: { lesson_id: lesson.id },
  })

  return NextResponse.json({ success: true, lesson })
}
