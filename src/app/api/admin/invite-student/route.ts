import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { application_id, full_name, email, phone, trainer_id, package_id, package_name, total_lessons } = await req.json()
  if (!email || !full_name) return NextResponse.json({ error: 'Ad ve e-posta zorunlu.' }, { status: 400 })

  const service = await createServiceClient()

  // Supabase Auth davet
  const { data: authData, error: authErr } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/student`,
  })
  if (authErr && !authErr.message.includes('already')) {
    return NextResponse.json({ error: authErr.message }, { status: 400 })
  }

  const authUserId = authData?.user?.id
  if (!authUserId) return NextResponse.json({ error: 'Kullanıcı oluşturulamadı.' }, { status: 400 })

  // Students tablosuna ekle
  const { data: student, error: studentErr } = await service.from('students').upsert({
    user_id: authUserId, application_id: application_id || null,
    full_name, email, phone: phone || null,
  }, { onConflict: 'email' }).select().single()
  if (studentErr) return NextResponse.json({ error: studentErr.message }, { status: 400 })

  // Enrollment oluştur
  if (package_name && total_lessons) {
    await service.from('enrollments').insert({
      student_id: student.id, trainer_id: trainer_id || null,
      package_id: package_id || null, package_name,
      total_lessons, lessons_remaining: total_lessons, is_active: true,
    })
  }

  // Uygulamayı güncelle
  if (application_id) {
    await service.from('applications').update({ status: 'approved' }).eq('id', application_id)
  }

  // Admin bildirimi
  await service.from('notifications').insert({
    type: 'student_created', target_role: 'admin',
    title: 'Öğrenci hesabı oluşturuldu',
    message: `${full_name} için öğrenci hesabı ve kayıt oluşturuldu.`,
    link: '/admin/students',
  })

  return NextResponse.json({ success: true, student })
}
